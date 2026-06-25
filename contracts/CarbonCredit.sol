// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCredit
 * @notice Tamper-proof, on-chain issuance and retirement of verified carbon credits.
 *         Each credit is an ERC-721 token carrying its action type and CO₂ amount.
 *         The platform (owner) issues credits for AI-verified green actions; holders
 *         can transfer them or permanently `retire` them to claim the offset.
 */
contract CarbonCredit is ERC721, Ownable {
    uint256 private _nextId;

    struct Credit {
        string actionType;   // e.g. "Reforestation"
        uint256 co2Grams;    // CO₂ offset represented, in grams
        bool retired;        // once retired, the offset is permanently claimed
        uint256 issuedAt;    // block timestamp of issuance
    }

    mapping(uint256 => Credit) public credits;

    event CreditIssued(uint256 indexed tokenId, address indexed to, string actionType, uint256 co2Grams);
    event CreditRetired(uint256 indexed tokenId, address indexed by);

    constructor() ERC721("EcoCredit Carbon Credit", "ECO") Ownable(msg.sender) {}

    /// @notice Mint a verified carbon credit to `to`. Restricted to the platform owner.
    function issueCredit(address to, string calldata actionType, uint256 co2Grams)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        tokenId = ++_nextId;
        _safeMint(to, tokenId);
        credits[tokenId] = Credit(actionType, co2Grams, false, block.timestamp);
        emit CreditIssued(tokenId, to, actionType, co2Grams);
    }

    /// @notice Permanently retire a credit you own to claim its offset.
    function retire(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "CarbonCredit: not owner");
        require(!credits[tokenId].retired, "CarbonCredit: already retired");
        credits[tokenId].retired = true;
        emit CreditRetired(tokenId, msg.sender);
    }

    function isRetired(uint256 tokenId) external view returns (bool) {
        return credits[tokenId].retired;
    }

    function totalIssued() external view returns (uint256) {
        return _nextId;
    }
}
