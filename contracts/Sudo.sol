// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "hardhat/console.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();
error NFT_ALREADY_VRFED();
error NFT_NOT_A_OWNER();
error NFT_NEEDS_VRF();

contract Sudo is ERC721A, VRFConsumerBaseV2, Ownable {
    // Sudo NFT variables
    bool minted;
    string public imageDefault;
    string[] public imagesVRFED;
    mapping(uint256 => uint8) vrfValue;
    mapping(uint256 => bool) vrfStatus;

    // In which phase is project currently
    enum PHASES {
        ONE,
        TWO,
        THREE,
        FOUR
    }
    PHASES public phase;
    string public ipfs;

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    mapping(uint256 => uint256) public requestIdToTokenId;

    // Chainlink Events
    event RandomRequested(uint256 indexed requestId, address requester);
    event RandomReceived(uint256 indexed random, uint256 indexed tokenId);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721A("Sudo rm -rf OpenSea", "0xDEL") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        ipfs = "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
    }

    // Update status by passing uint into input
    function setPhase(PHASES _phase) public onlyOwner {
        phase = _phase;
    }

    // Update ipfs
    function setIpfs(string memory _ipfs) public onlyOwner {
        ipfs = _ipfs;
    }

    // upload default image to chain
    function setDefaultImage(string memory _svg) public onlyOwner {
        imageDefault = string(abi.encodePacked(imageDefault, _svg));
    }

    // upload images to chain
    function setImages(string memory _svg, uint8 position) public onlyOwner {
        imagesVRFED[position] = string(abi.encodePacked(imagesVRFED[position], _svg));
    }

    function getVRF(uint256 tokenId) public payable onlyOwner returns (uint256 requestId) {
        if (msg.sender != ownerOf(tokenId)) {
            revert NFT_NOT_A_OWNER();
        }

        if (vrfStatus[tokenId] == true) {
            revert NFT_ALREADY_VRFED();
        }

        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        console.log(tokenId);
        requestIdToTokenId[requestId] = tokenId;
        emit RandomRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        // get random and then find module of 19 so we get max 18 pixels of length
        uint8 random = uint8(randomWords[0] % 19);
        // Put random to proper tokenID
        vrfValue[requestIdToTokenId[requestId]] = random;
        vrfStatus[requestIdToTokenId[requestId]] = true;

        emit RandomReceived(random, requestIdToTokenId[requestId]);
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        // Use different code depending on phase
        if (phase == PHASES.TWO) {
            // here we will use onchain storage of image, same one for all
            return tokenURI2(_tokenId);
        } else if (phase == PHASES.THREE) {
            // here we will use different IPFS image for each NFT depending on randomness that they got
            return tokenURI3(_tokenId);
        } else if (phase == PHASES.FOUR) {
            // here we are full of money and we deployed onchain each image and just pull them out
            return tokenURI4(_tokenId);
        } else {
            return ipfs;
        }
    }

    function tokenURI2(uint256 _tokenId) public view returns (string memory) {
        string memory json;
        if (!_exists(_tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        json = string(
            abi.encodePacked(
                '{"name":"',
                name(),
                '", "description":"SudoSwap taking over OpenSea", ',
                '"attributes": [{"trait_type": "status", "value": "original"}], "image":"',
                svgToImageURI(imageDefault),
                '"}'
            )
        );

        return string(abi.encodePacked(_baseURI(), Base64.encode(bytes(json))));
    }

    function tokenURI3(uint256 _tokenId) public view returns (string memory) {
        if (vrfStatus[_tokenId] == false) {
            revert NFT_NEEDS_VRF();
        }
        // Get json file with image according to random number gotten by VRF
        return string(abi.encodePacked(ipfs, Strings.toString(vrfValue[_tokenId]), ".json"));
    }

    function tokenURI4(uint256 _tokenId) public view returns (string memory) {
        if (vrfStatus[_tokenId] == false) {
            revert NFT_NEEDS_VRF();
        }

        string memory json;
        if (!_exists(_tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        json = string(
            abi.encodePacked(
                '{"name":"',
                name(),
                '", "description":"SudoSwap taking over OpenSea", ',
                '"attributes": [{"trait_type": "status", "value": "randomized"}], "image":"',
                svgToImageURI(imagesVRFED[vrfValue[_tokenId]]),
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

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function mint() external payable {
        require(!minted, "Mint already completed");

        _mint(msg.sender, 1024);
        minted = true;
    }
}
