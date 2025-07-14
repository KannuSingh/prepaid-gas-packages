/**
 * GraphQL queries for the prepaid gas paymaster subgraph
 *
 * These queries match the new subgraph schema and return network-aware data
 * with proper field selections for all entities.
 */

/**
 * Get paymaster with related data (pools, user operations, withdrawals)
 */
export const GET_PAYMASTER_WITH_RELATED = `
  query GetPaymasterWithRelated($id: ID!, $poolsFirst: Int!, $transactionsFirst: Int!, $withdrawalsFirst: Int!) {
    paymasterContract(id: $id) {
      id
      contractType
      address
      network
      chainId
      totalUsersDeposit
      currentDeposit
      revenue
      deployedAtBlock
      deployedAtTransaction
      deployedAtTimestamp
      lastUpdatedBlock
      lastUpdatedTimestamp
      pools(first: $poolsFirst, orderBy: createdAtTimestamp, orderDirection: desc) {
        id
        poolId
        joiningFee
        memberCount
        totalDeposits
        createdAtTimestamp
      }
      transactions(first: $transactionsFirst, orderBy: executedAtTimestamp, orderDirection: desc) {
        id
        userOpHash
        sender
        actualGasCost
        executedAtTimestamp
      }
      revenueWithdrawals(first: $withdrawalsFirst, orderBy: withdrawnAtTimestamp, orderDirection: desc) {
        id
        recipient
        amount
        withdrawnAtTimestamp
      }
    }
  }
`;

/**
 * Get pool details with members and merkle roots
 */
export const GET_POOL_DETAILS = `
  query GetPoolDetails($id: ID!, $membersFirst: Int!, $rootsFirst: Int!) {
    pool(id: $id) {
      id
      poolId
      network
      chainId
      joiningFee
      totalDeposits
      memberCount
      currentMerkleRoot
      currentRootIndex
      rootHistoryCount
      createdAtBlock
      createdAtTransaction
      createdAtTimestamp
      lastUpdatedBlock
      lastUpdatedTimestamp
      paymaster {
        id
        contractType
        address
        network
      }
      members(first: $membersFirst, orderBy: addedAtTimestamp, orderDirection: desc) {
        id
        memberIndex
        identityCommitment
        merkleRootWhenAdded
        rootIndexWhenAdded
        addedAtTimestamp
        gasUsed
        nullifierUsed
        nullifier
      }
      merkleRoots(first: $rootsFirst, orderBy: createdAtTimestamp, orderDirection: desc) {
        id
        root
        rootIndex
        createdAtTimestamp
      }
    }
  }
`;
