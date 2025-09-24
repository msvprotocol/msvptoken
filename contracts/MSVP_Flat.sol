// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.4) (utils/Context.sol)

pragma solidity 0.8.30;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}





            

// OpenZeppelin Contracts v4.4.1 (utils/introspection/IERC165.sol)

pragma solidity 0.8.30;

/**
 * @dev Interface of the ERC165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[EIP].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}





            

// OpenZeppelin Contracts (last updated v4.8.0) (utils/math/SignedMath.sol)

pragma solidity 0.8.30;

/**
 * @dev Standard signed math utilities missing in the Solidity language.
 */
library SignedMath {
    /**
     * @dev Returns the largest of two signed numbers.
     */
    function max(int256 a, int256 b) internal pure returns (int256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two signed numbers.
     */
    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two signed numbers without overflow.
     * The result is rounded towards zero.
     */
    function average(int256 a, int256 b) internal pure returns (int256) {
        // Formula from the book "Hacker's Delight"
        int256 x = (a & b) + ((a ^ b) >> 1);
        return x + (int256(uint256(x) >> 255) & (a ^ b));
    }

    /**
     * @dev Returns the absolute unsigned value of a signed value.
     */
    function abs(int256 n) internal pure returns (uint256) {
        unchecked {
            // must be unchecked in order to support `n = type(int256).min`
            return uint256(n >= 0 ? n : -n);
        }
    }
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/Math.sol)

pragma solidity 0.8.30;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    enum Rounding {
        Down, // Toward negative infinity
        Up, // Toward infinity
        Zero // Toward zero
    }

    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow.
        return (a & b) + (a ^ b) / 2;
    }

    /**
     * @dev Returns the ceiling of the division of two numbers.
     *
     * This differs from standard division with `/` in that it rounds up instead
     * of rounding down.
     */
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b - 1) / b can overflow on addition, so we distribute.
        return a == 0 ? 0 : (a - 1) / b + 1;
    }

    /**
     * @notice Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
     * @dev Original credit to Remco Bloemen under MIT license (https://xn--2-umb.com/21/muldiv)
     * with further edits by Uniswap Labs also under MIT license.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            // 512-bit multiply [prod1 prod0] = x * y. Compute the product mod 2^256 and mod 2^256 - 1, then use
            // use the Chinese Remainder Theorem to reconstruct the 512 bit result. The result is stored in two 256
            // variables such that product = prod1 * 2^256 + prod0.
            uint256 prod0; // Least significant 256 bits of the product
            uint256 prod1; // Most significant 256 bits of the product
            assembly {
                let mm := mulmod(x, y, not(0))
                prod0 := mul(x, y)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }

            // Handle non-overflow cases, 256 by 256 division.
            if (prod1 == 0) {
                // Solidity will revert if denominator == 0, unlike the div opcode on its own.
                // The surrounding unchecked block does not change this fact.
                // See https://docs.soliditylang.org/en/latest/control-structures.html#checked-or-unchecked-arithmetic.
                return prod0 / denominator;
            }

            // Make sure the result is less than 2^256. Also prevents denominator == 0.
            require(denominator > prod1, "Math: mulDiv overflow");

            ///////////////////////////////////////////////
            // 512 by 256 division.
            ///////////////////////////////////////////////

            // Make division exact by subtracting the remainder from [prod1 prod0].
            uint256 remainder;
            assembly {
                // Compute remainder using mulmod.
                remainder := mulmod(x, y, denominator)

                // Subtract 256 bit number from 512 bit number.
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            // Factor powers of two out of denominator and compute largest power of two divisor of denominator. Always >= 1.
            // See https://cs.stackexchange.com/q/138556/92363.

            // Does not overflow because the denominator cannot be zero at this stage in the function.
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                // Divide denominator by twos.
                denominator := div(denominator, twos)

                // Divide [prod1 prod0] by twos.
                prod0 := div(prod0, twos)

                // Flip twos such that it is 2^256 / twos. If twos is zero, then it becomes one.
                twos := add(div(sub(0, twos), twos), 1)
            }

            // Shift in bits from prod1 into prod0.
            prod0 |= prod1 * twos;

            // Invert denominator mod 2^256. Now that denominator is an odd number, it has an inverse modulo 2^256 such
            // that denominator * inv = 1 mod 2^256. Compute the inverse by starting with a seed that is correct for
            // four bits. That is, denominator * inv = 1 mod 2^4.
            uint256 inverse = (3 * denominator) ^ 2;

            // Use the Newton-Raphson iteration to improve the precision. Thanks to Hensel's lifting lemma, this also works
            // in modular arithmetic, doubling the correct bits in each step.
            inverse *= 2 - denominator * inverse; // inverse mod 2^8
            inverse *= 2 - denominator * inverse; // inverse mod 2^16
            inverse *= 2 - denominator * inverse; // inverse mod 2^32
            inverse *= 2 - denominator * inverse; // inverse mod 2^64
            inverse *= 2 - denominator * inverse; // inverse mod 2^128
            inverse *= 2 - denominator * inverse; // inverse mod 2^256

            // Because the division is now exact we can divide by multiplying with the modular inverse of denominator.
            // This will give us the correct result modulo 2^256. Since the preconditions guarantee that the outcome is
            // less than 2^256, this is the final result. We don't need to compute the high bits of the result and prod1
            // is no longer required.
            result = prod0 * inverse;
            return result;
        }
    }

    /**
     * @notice Calculates x * y / denominator with full precision, following the selected rounding direction.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator, Rounding rounding) internal pure returns (uint256) {
        uint256 result = mulDiv(x, y, denominator);
        if (rounding == Rounding.Up && mulmod(x, y, denominator) > 0) {
            result += 1;
        }
        return result;
    }

    /**
     * @dev Returns the square root of a number. If the number is not a perfect square, the value is rounded down.
     *
     * Inspired by Henry S. Warren, Jr.'s "Hacker's Delight" (Chapter 11).
     */
    function sqrt(uint256 a) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        // For our first guess, we get the biggest power of 2 which is smaller than the square root of the target.
        //
        // We know that the "msb" (most significant bit) of our target number `a` is a power of 2 such that we have
        // `msb(a) <= a < 2*msb(a)`. This value can be written `msb(a)=2**k` with `k=log2(a)`.
        //
        // This can be rewritten `2**log2(a) <= a < 2**(log2(a) + 1)`
        // → `sqrt(2**k) <= sqrt(a) < sqrt(2**(k+1))`
        // → `2**(k/2) <= sqrt(a) < 2**((k+1)/2) <= 2**(k/2 + 1)`
        //
        // Consequently, `2**(log2(a) / 2)` is a good first approximation of `sqrt(a)` with at least 1 correct bit.
        uint256 result = 1 << (log2(a) >> 1);

        // At this point `result` is an estimation with one bit of precision. We know the true value is a uint128,
        // since it is the square root of a uint256. Newton's method converges quadratically (precision doubles at
        // every iteration). We thus need at most 7 iteration to turn our partial result with one bit of precision
        // into the expected uint128 result.
        unchecked {
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            return min(result, a / result);
        }
    }

    /**
     * @notice Calculates sqrt(a), following the selected rounding direction.
     */
    function sqrt(uint256 a, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = sqrt(a);
            return result + (rounding == Rounding.Up && result * result < a ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 2, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 128;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 64;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 32;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 16;
            }
            if (value >> 8 > 0) {
                value >>= 8;
                result += 8;
            }
            if (value >> 4 > 0) {
                value >>= 4;
                result += 4;
            }
            if (value >> 2 > 0) {
                value >>= 2;
                result += 2;
            }
            if (value >> 1 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 2, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log2(value);
            return result + (rounding == Rounding.Up && 1 << result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 10, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) {
                value /= 10 ** 64;
                result += 64;
            }
            if (value >= 10 ** 32) {
                value /= 10 ** 32;
                result += 32;
            }
            if (value >= 10 ** 16) {
                value /= 10 ** 16;
                result += 16;
            }
            if (value >= 10 ** 8) {
                value /= 10 ** 8;
                result += 8;
            }
            if (value >= 10 ** 4) {
                value /= 10 ** 4;
                result += 4;
            }
            if (value >= 10 ** 2) {
                value /= 10 ** 2;
                result += 2;
            }
            if (value >= 10 ** 1) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 10, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log10(value);
            return result + (rounding == Rounding.Up && 10 ** result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 256, rounded down, of a positive value.
     * Returns 0 if given 0.
     *
     * Adding one to the result gives the number of pairs of hex symbols needed to represent `value` as a hex string.
     */
    function log256(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 16;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 8;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 4;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 2;
            }
            if (value >> 8 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 256, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log256(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log256(value);
            return result + (rounding == Rounding.Up && 1 << (result << 3) < value ? 1 : 0);
        }
    }
}





            

// OpenZeppelin Contracts v4.4.1 (utils/introspection/ERC165.sol)

pragma solidity 0.8.30;

////import "./IERC165.sol";

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 *
 * Alternatively, {ERC165Storage} provides an easier to use but more expensive implementation.
 */
abstract contract ERC165 is IERC165 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (utils/Strings.sol)

pragma solidity 0.8.30;

////import "./math/Math.sol";
////import "./math/SignedMath.sol";

/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant _SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    /**
     * @dev Converts a `int256` to its ASCII `string` decimal representation.
     */
    function toString(int256 value) internal pure returns (string memory) {
        return string(abi.encodePacked(value < 0 ? "-" : "", toString(SignedMath.abs(value))));
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, Math.log256(value) + 1);
        }
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function equal(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}





            

// OpenZeppelin Contracts v4.4.1 (access/IAccessControl.sol)

pragma solidity 0.8.30;

/**
 * @dev External interface of AccessControl declared to support ERC165 detection.
 */
interface IAccessControl {
    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     *
     * _Available since v3.1._
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call, an admin role
     * bearer except when using {AccessControl-_setupRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     */
    function renounceRole(bytes32 role, address account) external;
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity 0.8.30;

////import "../utils/Context.sol";

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/IERC20.sol)

pragma solidity 0.8.30;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * ////IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}





            

// OpenZeppelin Contracts v4.4.1 (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity 0.8.30;

////import "../IERC20.sol";

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 *
 * _Available since v4.1._
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}





            

// OpenZeppelin Contracts (last updated v4.7.0) (security/Pausable.sol)

pragma solidity 0.8.30;

////import "../utils/Context.sol";

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (security/ReentrancyGuard.sol)

pragma solidity 0.8.30;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (access/AccessControl.sol)

pragma solidity 0.8.30;

////import "./IAccessControl.sol";
////import "../utils/Context.sol";
////import "../utils/Strings.sol";
////import "../utils/introspection/ERC165.sol";

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with a standardized message including the required role.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     *
     * _Available since v4.1._
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual override returns (bool) {
        return _roles[role].members[account];
    }

    /**
     * @dev Revert with a standard message if `_msgSender()` is missing `role`.
     * Overriding this function changes the behavior of the {onlyRole} modifier.
     *
     * Format of the revert message is described in {_checkRole}.
     *
     * _Available since v4.6._
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Revert with a standard message if `account` is missing `role`.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        Strings.toHexString(account),
                        " is missing role ",
                        Strings.toHexString(uint256(role), 32)
                    )
                )
            );
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual override returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address account) public virtual override {
        require(account == _msgSender(), "AccessControl: can only renounce roles for self");

        _revokeRole(role, account);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event. Note that unlike {grantRole}, this function doesn't perform any
     * checks on the calling account.
     *
     * May emit a {RoleGranted} event.
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial roles for the system.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {AccessControl}.
     * ====
     *
     * NOTE: This function is deprecated in favor of {_grantRole}.
     */
    function _setupRole(bytes32 role, address account) internal virtual {
        _grantRole(role, account);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, _msgSender());
        }
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, _msgSender());
        }
    }
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable2Step.sol)

pragma solidity 0.8.30;

////import "./Ownable.sol";

/**
 * @dev Contract module which provides access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership} and {acceptOwnership}.
 *
 * This module is used through inheritance. It will make available all functions
 * from parent (Ownable).
 */
abstract contract Ownable2Step is Ownable {
    address private _pendingOwner;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Returns the address of the pending owner.
     */
    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner;
    }

    /**
     * @dev Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one.
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner(), newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`) and deletes any pending owner.
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual override {
        delete _pendingOwner;
        super._transferOwnership(newOwner);
    }

    /**
     * @dev The new owner accepts the ownership transfer.
     */
    function acceptOwnership() public virtual {
        address sender = _msgSender();
        require(pendingOwner() == sender, "Ownable2Step: caller is not the new owner");
        _transferOwnership(sender);
    }
}





            

// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/ERC20.sol)

pragma solidity 0.8.30;

////import "./IERC20.sol";
////import "./extensions/IERC20Metadata.sol";
////import "../../utils/Context.sol";

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 * For a generic mechanism see {ERC20PresetMinterPauser}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC20
 * applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IERC20-approve}.
 */
contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }

        return true;
    }

    /**
     * @dev Moves `amount` of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     */
    function _transfer(address from, address to, uint256 amount) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(from, to, amount);

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            // Overflow not possible: the sum of all balances is capped by totalSupply, and the sum is preserved by
            // decrementing then incrementing.
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);

        _afterTokenTransfer(from, to, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply += amount;
        unchecked {
            // Overflow not possible: balance + amount is at most totalSupply + amount, which is checked above.
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);

        _afterTokenTransfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            // Overflow not possible: amount <= accountBalance <= totalSupply.
            _totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);

        _afterTokenTransfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `amount`.
     *
     * Does not update the allowance amount in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Might emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {}

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual {}
}





pragma solidity 0.8.30;

/**
 * @title MSVTokenVesting
 * @dev MetaSoilVerse Token with integrated vesting functionality based on precise tokenomics schedule
 * Locked tokens are visible in balance but non-transferable
 */
contract MSVP is ERC20, Ownable2Step, ReentrancyGuard, Pausable, AccessControl {
    // Token configuration
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 * 10 ** 18; // 100 billion tokens
    uint256 public constant AIRDROP_SUPPLY = 50_000_000_000 * 10 ** 18; // 50 billion tokens for airdrop
    uint256 public constant MAX_TAX_RATE = 100; // Maximum 10% tax
    uint256 public constant TAX_DENOMINATOR = 1000; // Tax precision (0.1%)

    // Transfer tax configuration
    uint256 public transferTaxRate = 50; // 5% transfer tax
    uint256 public lpContributionRate = 20; // 2% to LP
    uint256 public developmentRate = 15; // 1.5% development fee
    uint256 public marketingRate = 10; // 1% marketing
    uint256 public burnRate = 5; // 0.5% burn

    // Addresses
    address public lpWallet;
    address public marketingWallet;
    address public developmentWallet;
    address public treasuryWallet; // receives residual tax when burnRate is zero

    // Excluded addresses from tax
    mapping(address => bool) public isExcludedFromTax;
    mapping(address => bool) public isExcludedFromMaxTx;

    // Max transaction limit
    uint256 public maxTxAmount = TOTAL_SUPPLY / 100; // 1% of total supply

    // Role-based access control
    bytes32 public constant SUBADMIN_ROLE = keccak256('SUBADMIN_ROLE');

    // Vesting configuration based on tokenomics schedule
    uint256 public constant CLIFF_DURATION = 180 days; // 6 months cliff
    uint256 public constant FIRST_YEAR_UNLOCK_PERCENTAGE = 12; // 1.2% (12/1000)
    uint256 public constant POST_Q5_UNLOCK_PERCENTAGE = 70; // 7% (70/1000)
    uint256 public constant FINAL_UNLOCK_PERCENTAGE = 60; // 6% (60/1000)

    // Vesting schedule per user
    struct VestingSchedule {
        uint256 totalAmount; // Total tokens allocated for vesting
        uint256 unlockedAmount; // Amount already unlocked
        uint256 startTime; // Vesting start time (TGE)
        uint256 endTime; // Vesting end time
        bool isActive; // Whether vesting is active
        bool isAirdrop; // Whether this is from airdrop
        address creator; // Address that created this schedule and can modify it
        bool isCancelled; // Whether this schedule was permanently cancelled
    }

    // Mapping from user address to vesting schedule (latest at creation; kept for backward compatibility only)
    mapping(address => VestingSchedule) public vestingSchedules;
    // Mapping from user address to all vesting schedules (supports multiple schedules per user)
    mapping(address => VestingSchedule[]) public userVestingSchedules;

    // Arrays to track all participants
    address[] public participants;
    mapping(address => bool) public isParticipant;

    // Admin controls
    uint256 public totalAllocated = 0;
    uint256 public totalUnlocked = 0;

    // Events
    event TransferTaxUpdated(uint256 newTaxRate);
    event LPContributionRateUpdated(uint256 newRate);
    event DevelopmentRateUpdated(uint256 newRate);
    event MarketingRateUpdated(uint256 newRate);
    event BurnRateUpdated(uint256 newRate);
    event LPWalletUpdated(address newWallet);
    event MarketingWalletUpdated(address newWallet);
    event DevelopmentWalletUpdated(address newWallet);
    event TreasuryWalletUpdated(address newWallet);
    event MaxTxAmountUpdated(uint256 newAmount);
    event TaxExclusionUpdated(address account, bool excluded);
    event MaxTxExclusionUpdated(address account, bool excluded);

    // Vesting events
    event VestingScheduleCreated(address indexed user, uint256 amount, uint256 startTime, uint256 endTime);
    event TokensUnlocked(address indexed user, uint256 amount, uint256 timestamp);
    event VestingScheduleModified(address indexed user, uint256 newAmount, uint256 timestamp);
    event EarlyRelease(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyUnlockAll(address indexed user, uint256 amount, uint256 timestamp);
    event VestingScheduleDeactivated(address indexed user, uint256 timestamp);
    event VestingScheduleReactivated(address indexed user, uint256 timestamp);
    event VestingScheduleCancelled(address indexed user, uint256 lockedAmount, uint256 timestamp);
    event AirdropStatusToggled(address indexed user, bool isAirdrop, uint256 timestamp);
    event VestingScheduleCompleted(address indexed user, uint256 totalAmount, uint256 timestamp);
    event VestingInconsistencyDetected(
        address indexed user,
        uint256 recordedAmount,
        uint256 calculatedAmount,
        uint256 timestamp
    );
    event TokensTransferredForVesting(address indexed user, uint256 amount, uint256 timestamp);

    // Role management events
    event SubadminAdded(address indexed subadmin, address indexed by);
    event SubadminRemoved(address indexed subadmin, address indexed by);

    constructor(
        address _lpWallet,
        address _marketingWallet,
        address _developmentWallet
    ) ERC20('MetaSoilVerseProtocol', 'MSVP') {
        require(_lpWallet != address(0), 'Invalid LP wallet');
        require(_marketingWallet != address(0), 'Invalid marketing wallet');
        require(_developmentWallet != address(0), 'Invalid development wallet');

        lpWallet = _lpWallet;
        marketingWallet = _marketingWallet;
        developmentWallet = _developmentWallet;
        treasuryWallet = _developmentWallet; // default treasury to development wallet

        // Exclude owner and contract from tax
        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[address(this)] = true;

        // Exclude owner and contract from max transaction limit
        isExcludedFromMaxTx[msg.sender] = true;
        isExcludedFromMaxTx[address(this)] = true;

        // Mint total supply to owner
        _mint(msg.sender, TOTAL_SUPPLY);

        // Set up initial roles
        _grantRole(SUBADMIN_ROLE, msg.sender);
    }

    // Role Management Functions

    /**
     * @dev Grant subadmin role to an address (only callable by owner)
     */
    function grantSubadminRole(address account) external onlyOwner {
        require(account != address(0), 'Invalid address');
        _grantRole(SUBADMIN_ROLE, account);
        // Exclude subadmin from transfer tax to avoid vesting allocation mismatches
        isExcludedFromTax[account] = true;
        emit SubadminAdded(account, msg.sender);
    }

    /**
     * @dev Revoke subadmin role from an address (only callable by owner)
     */
    function revokeSubadminRole(address account) external onlyOwner {
        require(account != address(0), 'Invalid address');
        _revokeRole(SUBADMIN_ROLE, account);
        // Remove tax exclusion when subadmin role is revoked
        isExcludedFromTax[account] = false;
        emit SubadminRemoved(account, msg.sender);
    }

    /**
     * @dev Update treasury wallet (receiver of residual tax when burn is disabled)
     */
    function updateTreasuryWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        treasuryWallet = newWallet;
        emit TreasuryWalletUpdated(newWallet);
    }

    /**
     * @dev Check if address has subadmin role
     */
    function hasSubadminRole(address account) external view returns (bool) {
        return hasRole(SUBADMIN_ROLE, account);
    }

    /**
     * @dev Override balanceOf to show actual token balance
     * This shows the real tokens held in the wallet (including received tokens)
     */
    function balanceOf(address account) public view override returns (uint256) {
        // Always show actual tokens in wallet
        return super.balanceOf(account);
    }

    /**
     * @dev Get vesting allocation (total tokens allocated for vesting)
     * This shows the vesting schedule amount, not the actual balance
     */
    function getVestingAllocation(address account) external view returns (uint256) {
        if (!isParticipant[account]) {
            return 0;
        }
        VestingSchedule[] storage schedules = userVestingSchedules[account];
        uint256 total = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            if (schedules[i].isActive) {
                total += schedules[i].totalAmount;
            }
        }
        return total;
    }

    /**
     * @dev Get transferable balance (unlocked tokens for vesting participants)
     * For vesting participants: returns unlocked vesting tokens + any other unlocked tokens
     * For non-participants: returns full balance
     */
    function transferableBalance(address account) public view returns (uint256) {
        if (isParticipant[account]) {
            // For vesting participants: unlocked vesting tokens + any other unlocked tokens
            uint256 totalBalance = super.balanceOf(account);
            uint256 lockedAmount = getLockedAmount(account);

            // The correct calculation: total balance - locked amount
            // This automatically includes unlocked vesting + any other tokens
            return totalBalance - lockedAmount;
        } else {
            // For non-participants, full balance is transferable
            return super.balanceOf(account);
        }
    }

    /**
     * @dev Override transfer to include vesting logic and tax
     */
    function _transfer(address from, address to, uint256 amount) internal virtual override whenNotPaused {
        require(from != address(0), 'ERC20: transfer from the zero address');
        require(to != address(0), 'ERC20: transfer to the zero address');
        require(amount > 0, 'Transfer amount must be greater than zero');

        // Update unlocked amounts for both addresses if they are participants
        if (isParticipant[from]) {
            updateUnlockedAmountsForUser(from);
        }
        if (isParticipant[to]) {
            updateUnlockedAmountsForUser(to);
        }

        // Check transferable balance
        uint256 transferable = transferableBalance(from);
        require(transferable >= amount, 'Insufficient transferable balance');

        // Check max transaction limit (unless excluded)
        if (!isExcludedFromMaxTx[from] && !isExcludedFromMaxTx[to]) {
            require(amount <= maxTxAmount, 'Transfer amount exceeds max transaction limit');
        }

        // Calculate tax
        uint256 taxAmount = 0;
        if (transferTaxRate > 0 && !isExcludedFromTax[from] && !isExcludedFromTax[to]) {
            taxAmount = (amount * transferTaxRate) / TAX_DENOMINATOR;
        }

        uint256 transferAmount = amount - taxAmount;

        // Transfer tokens to recipient (amount minus tax)
        super._transfer(from, to, transferAmount);

        // Transfer tax to contract if applicable
        if (taxAmount > 0) {
            super._transfer(from, address(this), taxAmount);
            _distributeTaxes(taxAmount);
        }
    }

    /**
     * @dev Distribute transfer taxes to different wallets
     */
    function _distributeTaxes(uint256 taxAmount) internal {
        // Only distribute if tax amount is greater than 0
        if (taxAmount == 0) {
            return;
        }

        uint256 remainingTax = taxAmount;

        // LP contribution
        if (lpContributionRate > 0) {
            uint256 lpAmount = (taxAmount * lpContributionRate) / transferTaxRate;
            if (lpAmount > 0) {
                super._transfer(address(this), lpWallet, lpAmount);
                remainingTax -= lpAmount;
            }
        }

        // Development fee
        if (developmentRate > 0) {
            uint256 developmentAmount = (taxAmount * developmentRate) / transferTaxRate;
            if (developmentAmount > 0) {
                super._transfer(address(this), developmentWallet, developmentAmount);
                remainingTax -= developmentAmount;
            }
        }

        // Marketing
        if (marketingRate > 0) {
            uint256 marketingAmount = (taxAmount * marketingRate) / transferTaxRate;
            if (marketingAmount > 0) {
                super._transfer(address(this), marketingWallet, marketingAmount);
                remainingTax -= marketingAmount;
            }
        }

        // Handle remaining tax
        if (remainingTax > 0) {
            if (burnRate > 0) {
                _burn(address(this), remainingTax);
            } else {
                // Redirect residual tax when burn is disabled
                super._transfer(address(this), treasuryWallet, remainingTax);
            }
        }
    }

    // Vesting Functions
    // The contract supports multiple vesting schedules per user.
    // All admin actions target a specific schedule via its index in `userVestingSchedules[user]`.
    // The compatibility mapping `vestingSchedules[user]` is set on creation only and is not mutated afterwards.

    /**
     * @notice Create a vesting schedule for a single user.
     * @dev Tokens are first transferred (with tax if applicable), then the post-tax credited amount
     *      is used as the schedule's totalAmount to ensure allocations match the actual received balance.
     *      The schedule is appended to `userVestingSchedules[user]` and the compatibility mapping is updated once.
     * @param user Recipient of the vesting schedule
     * @param amount Gross amount to transfer to the user (pre-tax)
     */
    function createVestingSchedule(address user, uint256 amount) external onlyRole(SUBADMIN_ROLE) nonReentrant {
        require(user != address(0), 'Invalid user address');
        require(amount > 0, 'Amount must be greater than zero');

        require(balanceOf(msg.sender) >= amount, 'Insufficient tokens for vesting');
        // Perform transfer which may apply tax
        _transfer(msg.sender, user, amount);

        // Determine actually credited (post-tax) amount to ensure schedule matches real balance
        bool taxApplies = (transferTaxRate > 0 && !isExcludedFromTax[msg.sender] && !isExcludedFromTax[user]);
        uint256 creditedAmount = taxApplies ? (amount - ((amount * transferTaxRate) / TAX_DENOMINATOR)) : amount;

        // Emit event with credited amount used for vesting
        emit TokensTransferredForVesting(user, creditedAmount, block.timestamp);

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (61 * 30 days); // 61 months total vesting period

        VestingSchedule memory newSchedule = VestingSchedule({
            totalAmount: creditedAmount,
            unlockedAmount: 0,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            isAirdrop: true,
            creator: msg.sender,
            isCancelled: false
        });

        // Store as the latest schedule (backward compatibility)
        vestingSchedules[user] = newSchedule;
        // Append to user's schedules (support multiple)
        userVestingSchedules[user].push(newSchedule);

        if (!isParticipant[user]) {
            participants.push(user);
            isParticipant[user] = true;
        }

        totalAllocated += creditedAmount;

        emit VestingScheduleCreated(user, creditedAmount, startTime, endTime);
    }

    /**
     * @notice Create multiple vesting schedules.
     * @dev Mirrors `createVestingSchedule` but for arrays; each entry uses the post-tax credited amount
     *      for the schedule's totalAmount. Invalid entries (zero address or zero amount) are skipped.
     */
    function createVestingSchedules(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyRole(SUBADMIN_ROLE) nonReentrant {
        require(users.length == amounts.length, 'Arrays length mismatch');
        require(users.length > 0, 'Empty arrays');

        uint256 totalTokensNeeded = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                totalTokensNeeded += amounts[i];
            }
        }
        require(balanceOf(msg.sender) >= totalTokensNeeded, 'Insufficient tokens for bulk vesting');

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (61 * 30 days); // 61 months total vesting period

        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                _transfer(msg.sender, users[i], amounts[i]);
                // Compute credited (post-tax) amount for vesting allocation
                bool taxApplies = (transferTaxRate > 0 &&
                    !isExcludedFromTax[msg.sender] &&
                    !isExcludedFromTax[users[i]]);
                uint256 creditedAmount = taxApplies
                    ? (amounts[i] - ((amounts[i] * transferTaxRate) / TAX_DENOMINATOR))
                    : amounts[i];
                emit TokensTransferredForVesting(users[i], creditedAmount, block.timestamp);

                VestingSchedule memory newSchedule = VestingSchedule({
                    totalAmount: creditedAmount,
                    unlockedAmount: 0,
                    startTime: startTime,
                    endTime: endTime,
                    isActive: true,
                    isAirdrop: true,
                    creator: msg.sender,
                    isCancelled: false
                });

                // Store as the latest schedule (backward compatibility)
                vestingSchedules[users[i]] = newSchedule;
                // Append to user's schedules (support multiple)
                userVestingSchedules[users[i]].push(newSchedule);

                if (!isParticipant[users[i]]) {
                    participants.push(users[i]);
                    isParticipant[users[i]] = true;
                }

                totalAllocated += creditedAmount;

                emit VestingScheduleCreated(users[i], creditedAmount, startTime, endTime);
            }
        }
    }

    /**
     * @dev Internal helper to get the index of the latest schedule for a user.
     * @return has Whether at least one schedule exists
     * @return idx Index of the last schedule when it exists
     */
    function _latestScheduleIndex(address user) internal view returns (bool has, uint256 idx) {
        uint256 len = userVestingSchedules[user].length;
        if (len == 0) {
            return (false, 0);
        }
        return (true, len - 1);
    }


    /**
     * @dev Compute the vested amount for a given schedule at a specific timestamp.
     *      Purely reads schedule fields and caps at `schedule.totalAmount`.
     */
    function _vestedAmountAt(VestingSchedule storage schedule, uint256 timestamp) internal view returns (uint256) {
        if (timestamp < schedule.startTime) {
            return 0;
        }
        if (timestamp >= schedule.endTime) {
            return schedule.totalAmount;
        }

        uint256 timeSinceStart = timestamp - schedule.startTime;
        uint256 monthsSinceStart = timeSinceStart / (30 * 24 * 60 * 60);
        if (monthsSinceStart < 7) {
            return 0;
        }

        uint256 totalVested = 0;
        // Phase 1: 1.2% at months 7,10,13,16,19
        uint256 firstYearUnlocks = 0;
        if (monthsSinceStart >= 7) firstYearUnlocks++;
        if (monthsSinceStart >= 10) firstYearUnlocks++;
        if (monthsSinceStart >= 13) firstYearUnlocks++;
        if (monthsSinceStart >= 16) firstYearUnlocks++;
        if (monthsSinceStart >= 19) firstYearUnlocks++;
        uint256 firstYearAmount = (schedule.totalAmount * FIRST_YEAR_UNLOCK_PERCENTAGE) / 1000;
        totalVested += firstYearAmount * firstYearUnlocks;

        // Phase 2: 7% every 3 months from 22 to 49
        if (monthsSinceStart >= 22) {
            uint256 postQ5Unlocks = 0;
            for (uint256 month = 22; month <= 49; month += 3) {
                if (monthsSinceStart >= month) {
                    postQ5Unlocks++;
                }
            }
            uint256 postQ5Amount = (schedule.totalAmount * POST_Q5_UNLOCK_PERCENTAGE) / 1000;
            totalVested += postQ5Amount * postQ5Unlocks;
        }

        // Phase 3: 6% every 3 months from 52 to 61
        if (monthsSinceStart >= 52) {
            uint256 finalUnlocks = 0;
            for (uint256 month = 52; month <= 61; month += 3) {
                if (monthsSinceStart >= month) {
                    finalUnlocks++;
                }
            }
            uint256 finalAmount = (schedule.totalAmount * FINAL_UNLOCK_PERCENTAGE) / 1000;
            totalVested += finalAmount * finalUnlocks;
        }

        if (totalVested > schedule.totalAmount) {
            totalVested = schedule.totalAmount;
        }
        return totalVested;
    }

    /**
     * @notice Early release of locked tokens for a specific schedule.
     * @dev Only owner can call. Amount must not exceed the schedule's remaining locked amount.
     */
    function earlyRelease(address user, uint256 index, uint256 amount) external onlyOwner nonReentrant {
        require(index < userVestingSchedules[user].length, 'Invalid schedule index');
        require(amount > 0, 'Amount must be greater than zero');
        VestingSchedule storage schedule = userVestingSchedules[user][index];
        require(schedule.isActive, 'No active vesting schedule');

        uint256 currentTime = block.timestamp;
        uint256 vestedForSchedule = _vestedAmountAt(schedule, currentTime);
        uint256 maxUnlocked = vestedForSchedule > schedule.unlockedAmount ? vestedForSchedule : schedule.unlockedAmount;
        uint256 lockedAmountForSchedule = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;
        require(amount <= lockedAmountForSchedule, 'Amount exceeds remaining locked tokens');

        schedule.unlockedAmount += amount;
        totalUnlocked += amount;
        // mapping unchanged; latest is derived from array on reads
        emit EarlyRelease(user, amount, block.timestamp);
    }

    /**
     * @notice Emergency unlock of all remaining tokens across all active schedules of a user.
     * @dev Marks schedules inactive and sets unlockedAmount to totalAmount.
     */
    function emergencyUnlockAll(address user) external onlyOwner nonReentrant {
        (bool has, ) = _latestScheduleIndex(user);
        require(has, 'No active vesting schedule');

        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 totalJustUnlocked = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive) {
                continue;
            }
            uint256 totalVested = _vestedAmountAt(schedule, block.timestamp);
            uint256 maxUnlocked = totalVested > schedule.unlockedAmount ? totalVested : schedule.unlockedAmount;
            uint256 lockedAmount = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;
            if (lockedAmount > 0) {
                schedule.unlockedAmount = schedule.totalAmount;
                totalJustUnlocked += lockedAmount;
                schedule.isActive = false;
            }
        }
        require(totalJustUnlocked > 0, 'No tokens left to unlock');
        totalUnlocked += totalJustUnlocked;
        // mapping unchanged; latest is derived from array on reads

        emit EmergencyUnlockAll(user, totalJustUnlocked, block.timestamp);
    }

    /**
     * @notice Modify an existing vesting schedule by index.
     * @dev Only the creator of the schedule can modify it. Increases transfer delta tokens from creator to user.
     *      New amount cannot be below the currently vested or previously unlocked amount.
     */
    function modifyVestingSchedule(address user, uint256 index, uint256 newAmount) external nonReentrant {
        require(index < userVestingSchedules[user].length, 'Invalid schedule index');
        VestingSchedule storage schedule = userVestingSchedules[user][index];
        require(schedule.isActive, 'No active vesting schedule');
        require(msg.sender == schedule.creator, 'Only schedule creator');

        uint256 currentTime = block.timestamp;
        uint256 recomputedVested = _vestedAmountAt(schedule, currentTime);
        uint256 floorAmount = schedule.unlockedAmount > recomputedVested ? schedule.unlockedAmount : recomputedVested;
        require(newAmount >= floorAmount, 'New amount less than vested');

        uint256 oldAmount = schedule.totalAmount;
        if (newAmount > oldAmount) {
            uint256 delta = newAmount - oldAmount;
            require(balanceOf(msg.sender) >= delta, 'Insufficient tokens for increase');
            _transfer(msg.sender, user, delta);
            emit TokensTransferredForVesting(user, delta, block.timestamp);
        }

        schedule.totalAmount = newAmount;
        totalAllocated = totalAllocated - oldAmount + newAmount;
        // mapping unchanged; latest is derived from array on reads
        updateUnlockedAmountsForUser(user);
        emit VestingScheduleModified(user, newAmount, block.timestamp);
    }

    /**
     * @notice Deactivate a vesting schedule by index.
     * @dev Pauses vesting accrual without deleting data.
     */
    function deactivateVestingSchedule(address user, uint256 index) external onlyOwner nonReentrant {
        require(index < userVestingSchedules[user].length, 'Invalid schedule index');
        VestingSchedule storage schedule = userVestingSchedules[user][index];
        require(schedule.isActive, 'No active vesting schedule');
        schedule.isActive = false;
        // mapping unchanged; latest is derived from array on reads
        emit VestingScheduleDeactivated(user, block.timestamp);
    }

    /**
     * @notice Reactivate a previously deactivated vesting schedule by index.
     * @dev Requires the user still has enough transferable balance to cover remaining locked tokens.
     */
    function reactivateVestingSchedule(address user, uint256 index) external onlyOwner nonReentrant {
        require(index < userVestingSchedules[user].length, 'Invalid schedule index');
        VestingSchedule storage schedule = userVestingSchedules[user][index];
        require(!schedule.isCancelled, 'Vesting schedule cancelled');
        require(!schedule.isActive, 'Vesting schedule is already active');
        require(schedule.startTime != 0, 'No vesting schedule exists');

        uint256 recomputedVested = _vestedAmountAt(schedule, block.timestamp);
        uint256 floorUnlocked = schedule.unlockedAmount > recomputedVested ? schedule.unlockedAmount : recomputedVested;
        uint256 remainingLocked = schedule.totalAmount > floorUnlocked ? (schedule.totalAmount - floorUnlocked) : 0;
        require(transferableBalance(user) >= remainingLocked, 'Insufficient balance to reactivate');

        schedule.isActive = true;
        // mapping unchanged; latest is derived from array on reads
        emit VestingScheduleReactivated(user, block.timestamp);
    }

    /**
     * @notice Cancel a vesting schedule by index.
     * @dev Permanently disables the schedule and zeroes its time fields; reduces totalAllocated by remaining locked.
     */
    function cancelVestingSchedule(address user, uint256 index) external onlyOwner nonReentrant {
        require(index < userVestingSchedules[user].length, 'Invalid schedule index');
        VestingSchedule storage schedule = userVestingSchedules[user][index];
        require(schedule.isActive, 'No active vesting schedule');

        uint256 currentTime = block.timestamp;
        uint256 vestedForSchedule = _vestedAmountAt(schedule, currentTime);
        uint256 maxUnlocked = vestedForSchedule > schedule.unlockedAmount ? vestedForSchedule : schedule.unlockedAmount;
        uint256 lockedAmount = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;

        schedule.isActive = false;
        schedule.isCancelled = true;
        schedule.startTime = 0;
        schedule.endTime = 0;

        totalAllocated -= lockedAmount;
        // mapping unchanged; latest is derived from array on reads
        emit VestingScheduleCancelled(user, lockedAmount, block.timestamp);
    }

    /**
     * @notice Toggle the `isAirdrop` flag for a schedule by index.
     */
    function toggleAirdropStatus(address user, uint256 index) external onlyOwner nonReentrant {
        require(index < userVestingSchedules[user].length, 'Invalid schedule index');
        VestingSchedule storage schedule = userVestingSchedules[user][index];
        require(schedule.isActive, 'No active vesting schedule');
        schedule.isAirdrop = !schedule.isAirdrop;
        // mapping unchanged; latest is derived from array on reads
        emit AirdropStatusToggled(user, schedule.isAirdrop, block.timestamp);
    }

    // old modifyVestingSchedule(address,uint256) removed in favor of index-based variant

    /**
     * @notice Update unlocked amounts for all participants.
     * @dev Iterates through all participants and updates their unlocked amounts.
     */
    function updateUnlockedAmounts() external onlyOwner {
        uint256 participantsLength = participants.length;
        for (uint256 i = 0; i < participantsLength; i++) {
            updateUnlockedAmountsForUser(participants[i]);
        }
    }

    /**
     * @notice Update unlocked amounts for a specific user.
     * @dev Iterates schedules and updates `unlockedAmount` based on current timestamp; emits events on changes.
     */
    function updateUnlockedAmountsForUser(address user) public {
        VestingSchedule[] storage schedules = userVestingSchedules[user];

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];

            if (!schedule.isActive || schedule.startTime == 0) {
                continue;
            }

            // Calculate vested amount for this schedule
            uint256 currentTime = block.timestamp;
            if (currentTime >= schedule.endTime) {
                if (schedule.unlockedAmount < schedule.totalAmount) {
                    uint256 additional = schedule.totalAmount - schedule.unlockedAmount;
                    schedule.unlockedAmount = schedule.totalAmount;
                    totalUnlocked += additional;
                    emit TokensUnlocked(user, additional, block.timestamp);
                }
                schedule.isActive = false;
                emit VestingScheduleCompleted(user, schedule.totalAmount, block.timestamp);
                continue;
            }
            uint256 newUnlockedAmount = _vestedAmountAt(schedule, currentTime);

            if (newUnlockedAmount > schedule.unlockedAmount) {
                uint256 additionalUnlocked = newUnlockedAmount - schedule.unlockedAmount;
                schedule.unlockedAmount = newUnlockedAmount;
                totalUnlocked += additionalUnlocked;

                emit TokensUnlocked(user, additionalUnlocked, block.timestamp);
            } else if (newUnlockedAmount < schedule.unlockedAmount) {
                // Log inconsistency but don't decrease unlocked amount
                emit VestingInconsistencyDetected(user, schedule.unlockedAmount, newUnlockedAmount, block.timestamp);
            }

            // Complete schedule if fully vested
            if (newUnlockedAmount >= schedule.totalAmount && schedule.isActive) {
                schedule.isActive = false;
                emit VestingScheduleCompleted(user, schedule.totalAmount, block.timestamp);
            }
        }
        // mapping unchanged; latest is derived from array on reads
    }

    /**
     * @notice Get the total vested amount across all active schedules for a user at the current time.
     */
    function getVestedAmount(address user) public view returns (uint256) {
        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 aggregateVested = 0;

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive || schedule.startTime == 0) {
                continue;
            }
            uint256 currentTime = block.timestamp;
            aggregateVested += _vestedAmountAt(schedule, currentTime);
        }

        return aggregateVested;
    }

    /**
     * @notice Get the stored unlocked amount aggregated across all schedules for a user.
     */
    function getUnlockedAmount(address user) external view returns (uint256) {
        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 total = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            total += schedules[i].unlockedAmount;
        }
        return total;
    }

    /**
     * @notice Get the currently locked amount aggregated across all active schedules for a user.
     */
    function getLockedAmount(address user) public view returns (uint256) {
        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 totalLocked = 0;

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive) {
                continue;
            }
            uint256 currentTime = block.timestamp;
            if (currentTime >= schedule.endTime) {
                continue;
            }
            uint256 totalVested = _vestedAmountAt(schedule, currentTime);
            uint256 userUnlocked = schedule.unlockedAmount;
            uint256 maxUnlocked = totalVested > userUnlocked ? totalVested : userUnlocked;
            uint256 lockedAmount = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;
            totalLocked += lockedAmount;
        }

        return totalLocked;
    }

    /**
     * @notice Get the latest vesting schedule (last created) for a user.
     * @dev Returns zeroed fields when no schedules exist.
     */
    function getVestingSchedule(
        address user
    )
        external
        view
        returns (
            uint256 totalAmount,
            uint256 unlockedAmount,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isAirdrop
        )
    {
        VestingSchedule[] storage schedules = userVestingSchedules[user];
        if (schedules.length == 0) {
            return (0, 0, 0, 0, false, false);
        }
        VestingSchedule storage schedule = schedules[schedules.length - 1];
        return (
            schedule.totalAmount,
            schedule.unlockedAmount,
            schedule.startTime,
            schedule.endTime,
            schedule.isActive,
            schedule.isAirdrop
        );
    }

    /**
     * @dev Get all participants
     */
    function getAllParticipants() external view returns (address[] memory) {
        return participants;
    }

    /**
     * @dev Get participant count
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    /**
     * @dev Check if a vesting schedule is complete (all tokens unlocked)
     */
    function isVestingComplete(address user) external view returns (bool) {
        VestingSchedule[] storage schedules = userVestingSchedules[user];

        if (schedules.length == 0) {
            return false;
        }

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive) {
                continue;
            }
            uint256 currentTime = block.timestamp;
            if (currentTime >= schedule.endTime) {
                continue;
            }
            if (currentTime < schedule.startTime) {
                return false;
            }
            uint256 totalVested = _vestedAmountAt(schedule, currentTime);
            if (totalVested < schedule.totalAmount) {
                return false;
            }
        }

        return true;
    }

    /**
     * @dev Get vesting statistics
     */
    function getVestingStats()
        external
        view
        returns (
            uint256 totalParticipants,
            uint256 totalAllocatedTokens,
            uint256 totalUnlockedTokens,
            uint256 remainingTokens,
            bool isVestingStarted
        )
    {
        return (
            participants.length,
            totalAllocated,
            totalUnlocked,
            totalAllocated - totalUnlocked,
            participants.length > 0
        );
    }

    // Admin functions (inherited from original token)

    /**
     * @dev Update transfer tax rate
     */
    function updateTransferTaxRate(uint256 newTaxRate) external onlyOwner {
        require(newTaxRate <= MAX_TAX_RATE, 'Tax rate too high');
        // Ensure component sum does not exceed the new transfer tax rate, unless disabling tax entirely
        if (newTaxRate > 0) {
            require(
                lpContributionRate + developmentRate + marketingRate + burnRate <= newTaxRate,
                'Components exceed tax rate'
            );
        }
        transferTaxRate = newTaxRate;
        emit TransferTaxUpdated(newTaxRate);
    }

    /**
     * @dev Update LP contribution rate
     */
    function updateLPContributionRate(uint256 newRate) external onlyOwner {
        require(newRate + developmentRate + marketingRate + burnRate <= transferTaxRate, 'Components exceed tax rate');
        lpContributionRate = newRate;
        emit LPContributionRateUpdated(newRate);
    }

    /**
     * @dev Update development rate
     */
    function updateDevelopmentRate(uint256 newRate) external onlyOwner {
        require(lpContributionRate + newRate + marketingRate + burnRate <= transferTaxRate, 'Components exceed tax rate');
        developmentRate = newRate;
        emit DevelopmentRateUpdated(newRate);
    }

    /**
     * @dev Update marketing rate
     */
    function updateMarketingRate(uint256 newRate) external onlyOwner {
        require(lpContributionRate + developmentRate + newRate + burnRate <= transferTaxRate, 'Components exceed tax rate');
        marketingRate = newRate;
        emit MarketingRateUpdated(newRate);
    }

    /**
     * @dev Update burn rate
     */
    function updateBurnRate(uint256 newRate) external onlyOwner {
        require(lpContributionRate + developmentRate + marketingRate + newRate <= transferTaxRate, 'Components exceed tax rate');
        burnRate = newRate;
        emit BurnRateUpdated(newRate);
    }

    /**
     * @dev Update LP wallet
     */
    function updateLPWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        lpWallet = newWallet;
        emit LPWalletUpdated(newWallet);
    }

    /**
     * @dev Update marketing wallet
     */
    function updateMarketingWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        marketingWallet = newWallet;
        emit MarketingWalletUpdated(newWallet);
    }

    /**
     * @dev Update development wallet
     */
    function updateDevelopmentWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        developmentWallet = newWallet;
        emit DevelopmentWalletUpdated(newWallet);
    }

    /**
     * @dev Update max transaction amount
     */
    function updateMaxTxAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, 'Max tx amount must be greater than zero');
        maxTxAmount = newAmount;
        emit MaxTxAmountUpdated(newAmount);
    }

    /**
     * @dev Exclude/include address from transfer tax
     */
    function setTaxExclusion(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
        emit TaxExclusionUpdated(account, excluded);
    }

    /**
     * @dev Exclude/include address from max transaction limit
     */
    function setMaxTxExclusion(address account, bool excluded) external onlyOwner {
        isExcludedFromMaxTx[account] = excluded;
        emit MaxTxExclusionUpdated(account, excluded);
    }

    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Burn admin rights (irreversible)
     */
    function burnAdminRights() external onlyOwner whenNotPaused {
        renounceOwnership();
    }

    /**
     * @dev Get current tax breakdown
     */
    function getTaxBreakdown()
        external
        view
        returns (uint256 transferTax, uint256 lpContribution, uint256 development, uint256 marketing, uint256 burn)
    {
        return (transferTaxRate, lpContributionRate, developmentRate, marketingRate, burnRate);
    }

    /**
     * @dev Check if address is excluded from tax
     */
    function isTaxExcluded(address account) external view returns (bool) {
        return isExcludedFromTax[account];
    }

    /**
     * @dev Check if address is excluded from max transaction limit
     */
    function isMaxTxExcluded(address account) external view returns (bool) {
        return isExcludedFromMaxTx[account];
    }

    /**
     * @notice Pre-check for bulk vesting operations.
     * @param users Array of user addresses
     * @param amounts Array of token amounts
     * @return totalTokensNeeded Total tokens required for the operation
     * @return adminBalance Current admin token balance
     * @return canProceed Whether the operation can proceed
     * @return validEntries Number of valid vesting entries
     */
    function checkVestingRequirements(
        address[] calldata users,
        uint256[] calldata amounts
    ) external view returns (uint256 totalTokensNeeded, uint256 adminBalance, bool canProceed, uint256 validEntries) {
        require(users.length == amounts.length, 'Arrays length mismatch');

        totalTokensNeeded = 0;
        validEntries = 0;

        for (uint256 i = 0; i < amounts.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                totalTokensNeeded += amounts[i];
                validEntries++;
            }
        }

        adminBalance = balanceOf(msg.sender);
        canProceed = adminBalance >= totalTokensNeeded;

        return (totalTokensNeeded, adminBalance, canProceed, validEntries);
    }

    /**
     * @dev Withdraw MSVP tokens held by the contract (e.g., residual taxes)
     */
    function withdrawContractTokens(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), 'Invalid address');
        require(amount > 0, 'Amount must be greater than zero');
        require(balanceOf(address(this)) >= amount, 'Insufficient contract balance');
        super._transfer(address(this), to, amount);
    }
}

