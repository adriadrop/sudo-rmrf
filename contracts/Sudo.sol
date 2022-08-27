// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract Sudo is ERC721A {
    bool minted;
    string private imageURIBase;
    mapping(uint256 => uint8) powerBarStatus;
    string private powerBarBG;

    constructor(string memory svgBaseSliced, string memory svgPowerBar) ERC721A("Sudo rm -rf OpenSea", "0xDEL") {
        imageURIBase = svgBaseSliced;
        powerBarBG = svgPowerBar;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function powerUp(uint256 tokenId) public {
        require(msg.sender == ownerOf(tokenId), "Not a Owner");
        // There is 18 pixels in power bar, we want to have option that it is full
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, tokenId))) % 19);

        powerBarStatus[tokenId] = random;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        string memory imageURI;
        string memory json;
        if (!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        uint8 powerValue = powerBarStatus[tokenId];

        if (powerValue > 0) {
            imageURI = svgToImageURI(
                string(
                    abi.encodePacked(
                        imageURIBase,
                        powerBarBG,
                        '<rect width="',
                        Strings.toString(powerBarStatus[tokenId]),
                        '" height="1" x="43" y="2.5" style="fill:rgb(229,59,68);"/><rect width="',
                        Strings.toString(powerBarStatus[tokenId]),
                        '" height="1" x="43" y="3.5" style="fill:rgb(158,40,53);"/>',
                        "</svg>"
                    )
                )
            );
            json = string(
                abi.encodePacked(
                    '{"name":"',
                    name(),
                    '", "description":"SudoSwap taking over OpenSea", ',
                    '"attributes": [{"trait_type": "power", "value": 100}, {"trait_type": "vanilla", "value": false}], "image":"',
                    imageURI,
                    '"}'
                )
            );
        } else {
            imageURI = svgToImageURI(string(abi.encodePacked(imageURIBase, "</svg>")));
            json = string(
                abi.encodePacked(
                    '{"name":"',
                    name(),
                    '", "description":"SudoSwap taking over OpenSea", ',
                    '"attributes": [{"trait_type": "vanilla", "value": true}], "image":"',
                    imageURI,
                    '"}'
                )
            );
        }

        return string(abi.encodePacked(_baseURI(), Base64.encode(bytes(json))));
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }

    function mint() external payable {
        require(!minted, "Mint already completed");

        _mint(msg.sender, 1000);
        minted = true;
    }
}
