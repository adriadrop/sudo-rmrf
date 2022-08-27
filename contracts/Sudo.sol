// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "hardhat/console.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();
error NFT_ALREADY_POWERED();
error NFT_NOT_A_OWNER();

contract Sudo is ERC721A, VRFConsumerBaseV2 {
    // Sudo NFT variables
    bool minted;
    string private imageURIBase;
    string private powerBarBG;
    mapping(uint256 => uint8) powerBarValue;
    mapping(uint256 => bool) powerBarStatus;

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 4;
    mapping(uint256 => uint256) public requestIdToTokenId;

    event RandomRequested(uint256 indexed requestId, address requester);
    event RandomReceived(uint256 indexed random, uint256 indexed tokenId);

    constructor(
        string memory svgBaseSliced,
        string memory svgPowerBar,
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721A("Sudo rm -rf OpenSea", "0xDEL") {
        imageURIBase = svgBaseSliced;
        powerBarBG = svgPowerBar;

        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function powerUp(uint256 tokenId) public payable returns (uint256 requestId) {
        if (msg.sender != ownerOf(tokenId)) {
            revert NFT_NOT_A_OWNER();
        }

        if (powerBarStatus[tokenId] == true) {
            revert NFT_ALREADY_POWERED();
        }

        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        requestIdToTokenId[requestId] = tokenId;
        emit RandomRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        // get random and then find module of 19 so we get max 18 pixels of length
        uint8 random = uint8(randomWords[0] % 19);
        // Put random to proper tokenID
        powerBarValue[requestIdToTokenId[requestId]] = random;
        powerBarStatus[requestIdToTokenId[requestId]] = true;

        emit RandomReceived(random, requestIdToTokenId[requestId]);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        string memory imageURI;
        string memory json;
        if (!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        // We check the status and is it set to some number
        if (powerBarStatus[tokenId]) {
            imageURI = svgToImageURI(
                string(
                    abi.encodePacked(
                        imageURIBase,
                        powerBarBG,
                        '<rect width="',
                        Strings.toString(powerBarValue[tokenId]),
                        '" height="1" x="43" y="2.5" style="fill:rgb(229,59,68);"/><rect width="',
                        Strings.toString(powerBarValue[tokenId]),
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
