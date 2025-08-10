// Test consumer that only imports the optimized ABI
import { ONE_TIME_USE_PAYMASTER_ABI_OPTIMIZED, BASE_PAYMASTER_ABI } from '../src/abi';

console.log('OneTimeUse ABI length:', ONE_TIME_USE_PAYMASTER_ABI_OPTIMIZED.length);
console.log('Base ABI length:', BASE_PAYMASTER_ABI.length);
