// file :demo-counter-app/components/features/paymaster/pool-selector.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Search,
  Fuel,
} from "lucide-react";
import { Identity } from "@semaphore-protocol/core";
import { formatEther } from "viem";
import { ApiClient } from "@/lib/api-client";
import { useGasData } from "@/hooks/use-gas-data";

interface CouponOption {
  poolId: string;
  joiningFee: string;
}

interface GasData {
  gasUsed: bigint;
  // lastMerkleRoot: bigint;
  joiningFee: string;
  remainingGas: bigint;
  nullifier: bigint;
}

interface PoolSelectorProps {
  identity: Identity;
  onBack: () => void;
  onSelectPool: (poolId: string) => void;
  isLoading?: boolean;
}

function formatGasAmount(amount: bigint): string {
  return `${formatEther(amount)} ETH`;
}

function GasUsageDisplay({
  gasData,
  isLoading,
}: {
  gasData: GasData | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading gas data...</span>
      </div>
    );
  }

  if (!gasData) {
    return (
      <div className="text-xs text-muted-foreground">
        <span>Gas data unavailable</span>
      </div>
    );
  }

  const { gasUsed, remainingGas, joiningFee } = gasData;
  const isLowBalance = remainingGas <= BigInt(joiningFee) / BigInt(10); // Less than 10% remaining

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Fuel
          className={`h-3 w-3 ${isLowBalance ? "text-destructive" : "text-green-600"}`}
        />
        <span className="text-xs font-medium">Gas Balance</span>
      </div>
      <div className="text-xs space-y-0.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deposited:</span>
          <span className="font-mono">
            {formatGasAmount(BigInt(joiningFee))}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Used:</span>
          <span className="font-mono">{formatGasAmount(gasUsed)}</span>
        </div>
        <div className="flex justify-between border-t pt-0.5">
          <span className="text-muted-foreground">Remaining:</span>
          <span
            className={`font-mono font-medium ${isLowBalance ? "text-destructive" : "text-green-600"}`}
          >
            {formatGasAmount(remainingGas)}
          </span>
        </div>
        {/* Add usage percentage */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Usage:</span>
          <span>
            {((Number(gasUsed) / Number(joiningFee)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      {isLowBalance && (
        <div className="text-xs text-destructive">
          ⚠️ Low balance - consider topping up
        </div>
      )}
    </div>
  );
}

export function PoolSelector({
  identity,
  onBack,
  onSelectPool,
  isLoading,
}: PoolSelectorProps) {
  const [availableCoupons, setAvailableCoupons] = useState<CouponOption[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string>();
  const [isSearchingCoupons, setIsSearchingCoupons] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Gas data hook
  const {
    gasDataMap,
    isLoading: isLoadingGasData,
    fetchGasData,
    clearGasData,
  } = useGasData();

  // Track if search has been completed for this identity
  const searchedIdentityRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Set mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Search for available coupons when component mounts
  useEffect(() => {
    const identityCommitment = identity.commitment.toString();

    // Prevent duplicate searches for the same identity
    if (searchedIdentityRef.current === identityCommitment) {
      return;
    }

    const searchForCoupons = async () => {
      try {
        setIsSearchingCoupons(true);
        setSearchError(null);
        clearGasData(); // Clear previous gas data

        // Mark this identity as being searched
        searchedIdentityRef.current = identityCommitment;

        // Use API route instead of direct subgraph call
        const pools = await ApiClient.getPoolsByIdentity(identityCommitment);

        // Extract pool IDs (data is now serialized strings)
        const coupons: CouponOption[] = pools.map((poolMembership) => ({
          poolId: poolMembership.pool.poolId, // Already a string now
          joiningFee: poolMembership.pool.joiningFee,
        }));

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setAvailableCoupons(coupons);

          // Auto-select first coupon if only one available
          if (coupons.length === 1 && coupons[0]) {
            setSelectedCouponId(coupons[0].poolId);
          }

          // Fetch gas data for all pools
          if (coupons.length > 0) {
            fetchGasData(identity, coupons);
          }
        }
      } catch (error) {
        console.error("Error searching for coupons:", error);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setSearchError("Failed to search for available pools");
        }
      } finally {
        // Only update loading state if component is still mounted
        if (isMountedRef.current) {
          setIsSearchingCoupons(false);
        }
      }
    };

    // Only run if we have an identity
    if (identity?.commitment) {
      searchForCoupons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.commitment, fetchGasData, clearGasData]);

  const handleSelectPool = () => {
    if (selectedCouponId) {
      onSelectPool(selectedCouponId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Identity: {identity.commitment.toString().slice(0, 8)}...
        </div>
      </div>

      {isSearchingCoupons ? (
        <div className="text-center py-8">
          <Search className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Searching blockchain for your pools...
          </p>
        </div>
      ) : searchError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      ) : availableCoupons.length === 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No paymaster pools found for this identity. Make sure you have
            joined a pool using this identity.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Select Paymaster Pool ({availableCoupons.length} found)
          </Label>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableCoupons.map((coupon) => {
              const gasData = gasDataMap[coupon.poolId];
              const hasLowBalance =
                gasData &&
                gasData.remainingGas <= BigInt(gasData.joiningFee) / BigInt(10);

              return (
                <Card
                  key={coupon.poolId}
                  className={`cursor-pointer transition-colors ${
                    selectedCouponId === coupon.poolId
                      ? "border-primary bg-primary/5"
                      : hasLowBalance
                        ? "border-destructive/30 hover:border-destructive/50"
                        : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => {
                    setSelectedCouponId(coupon.poolId);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            Pool #{coupon.poolId}
                          </div>
                          {selectedCouponId === coupon.poolId && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        {/* Gas Usage Information */}
                        {gasData && (
                          <GasUsageDisplay
                            gasData={gasData}
                            isLoading={isLoadingGasData}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={handleSelectPool}
            disabled={isLoading || !selectedCouponId}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving Configuration...
              </>
            ) : (
              "Save Paymaster Configuration"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
