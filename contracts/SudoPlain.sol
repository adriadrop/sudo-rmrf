// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract SudoPlain is ERC721A {
    // Sudo NFT variables
    bool minted;
    string private imageURIBase;

    constructor(string memory svgBaseSliced) ERC721A("SudoRMRF", "DEL") {
        imageURIBase = svgBaseSliced;
        _mint(msg.sender, 1024);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        string memory imageURI;
        string memory json;
        if (!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

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
        return string(abi.encodePacked(_baseURI(), Base64.encode(bytes(json))));
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }
}
