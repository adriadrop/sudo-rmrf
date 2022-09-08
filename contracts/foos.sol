// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {ERC721} from "solmate/tokens/ERC721.sol";
import {Owned} from "solmate/auth/Owned.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";

// https://twitter.com/0xfoobar/status/1566947546131464193

contract FooFighters is ERC721, Owned {
    using Strings for uint256;

    uint256 public constant MAX_INITIAL_POWER = 100;
    uint256 public constant COOLDOWN = 1 hours;

    bool public mintingClosed = false;
    bool public hogwild = false;
    uint256 public totalSupply = 0;
    uint256 public shift = 0;

    /// @notice tokenId -> power, power in the [1, MAX_INITIAL_POWER] range inclusive
    /// @dev This value will be shifted once minting finalizes, use power()
    mapping(uint256 => uint256) internal unshiftedPower;

    /// @notice Incremental changes in a token's power
    mapping(uint256 => int256) public powerDelta;

    /// @notice tokenId -> health stats
    /// @dev health gets initialized at 255
    mapping(uint256 => uint256) public health;

    /// @notice tokenId -> attacking renewal timestamp
    mapping(uint256 => uint256) public attackerCooldown;

    /// @notice tokenId -> shield expiration timestamp
    mapping(uint256 => uint256) public shieldCooldown;

    constructor() ERC721("FooFightersBeta", "FOO") Owned(tx.origin) {}

    /// @notice Attack another fighter
    /// @param attackerId Your token
    /// @param defenderId The token to attack
    function FOOFIGHTER_attack(uint256 attackerId, uint256 defenderId) external {
        require(mintingClosed, "minting ongoing");
        require(hogwild || msg.sender == _ownerOf[attackerId], "not your token");
        require(block.timestamp > attackerCooldown[attackerId], "attacker in cooldown mode");
        require(block.timestamp > shieldCooldown[defenderId], "defender in shielded mode");

        uint256 attackerPower = uint256(power(attackerId));
        uint256 defenderHealth = health[defenderId];
        if (attackerPower >= defenderHealth) {
            _burn(defenderId);
            totalSupply--;
            powerDelta[attackerId] += powerDelta[defenderId]; // Protect the weak, make the strong eat their own
        } else {
            health[defenderId] -= attackerPower;
        }
        powerDelta[attackerId]++; // Reward the courageous
        attackerCooldown[attackerId] = block.timestamp + COOLDOWN;
        if (power(attackerId) < 0) {
            _burn(attackerId);
            totalSupply--;
        }
    }

    /// @notice Protect yourself from attacks for a brief time
    /// @param tokenId Your token to protect
    function FOOFIGHTER_shield(uint256 tokenId) external {
        require(mintingClosed, "minting ongoing");
        require(hogwild || msg.sender == _ownerOf[tokenId], "not your token");
        require(block.timestamp > attackerCooldown[tokenId], "can't shield until attacker cooldown over");

        attackerCooldown[tokenId] = block.timestamp + COOLDOWN;
        shieldCooldown[tokenId] = block.timestamp + COOLDOWN;
        powerDelta[tokenId]--; // Punish the cowards
        if (power(tokenId) < 0) {
            _burn(tokenId);
            totalSupply--;
        }
    }

    /// @notice Mint a FooFighter for free!
    function FOOFIGHTER_mint() external {
        require(!mintingClosed, "minting closed");
        // totalsupply is used as tokenID to set power and health
        unshiftedPower[totalSupply] = unsafeRandom(MAX_INITIAL_POWER, totalSupply); // number below 100, as it is module of MAX
        health[totalSupply] = 255;
        _mint(msg.sender, totalSupply++);
    }

    /// @dev Returns a random value in [0, max-1]
    function unsafeRandom(uint256 max, uint256 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encode(blockhash(block.number - 1), block.timestamp, msg.sender, seed))) % max;
    }

    function finalizeMinting() external onlyOwner {
        mintingClosed = true;
        if (shift == 0) {
            shift = unsafeRandom(MAX_INITIAL_POWER, totalSupply) + 1; // this needs to be at least 1, but could be up to 100
        }
    }

    // ex 50 + 40  % 100 + powerDelta
    // intersting part with SHIFT as it goes like pendulum I suppose
    function power(uint256 tokenId) public view returns (int256) {
        require(_ownerOf[tokenId] != address(0), "token does not exist");
        return int256((unshiftedPower[tokenId] + shift) % MAX_INITIAL_POWER) + powerDelta[tokenId];
    }

    // https://goerli.etherscan.io/address/0x9490165195503fcf6a0fd20ac113223fefb66ed5#code
}
