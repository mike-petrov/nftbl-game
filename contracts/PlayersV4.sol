//SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./Counters.sol";
import "./ERC20.sol";
import "./ERC721.sol";

contract PlayersV4 is ERC721 {
    // Royalty
    address private _owner;
    address private _royaltiesAddr; // royality receiver
    uint256 public royaltyPercentage; // royalty based on sales price
    mapping(address => bool) public excludedList; // list of people who dont have to pay fee

    // cost to mint
    uint256 public mintFeeAmount;

    // // NFT Meta data
    string public baseURL;

    uint256 public constant maxSupply = 10000;

    bool public openForPublic;

    // define PlayersObj struct
    struct PlayersObj {
        uint256 tokenId;
        // string tokenURI;
        address mintedBy;
        address currentOwner;
        uint256 previousPrice;
        uint256 price;
        uint256 numberOfTransfers;
        bool forSale;
        uint256 lvl;
    }

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // map id to PlayersObj obj
    mapping(uint256 => PlayersObj) public allPlayers;

    // Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;

    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    // Array with all token ids, used for enumeration
    uint256[] private _allTokens;

    // Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) private _allTokensIndex;

    event SaleToggle(uint256 playerNumber, bool isForSale, uint256 price);
    event PurchaseEvent(uint256 playerNumber, address from, address to, uint256 price);


    constructor(
        uint256 _mintFeeAmount,
        string memory _baseURL
    ) ERC721("player", "player") {
        _owner = msg.sender;
        mintFeeAmount = _mintFeeAmount;
        excludedList[_owner] = true; // add owner to exclude list
        baseURL = _baseURL;
        openForPublic = true;
    }

    function mint(uint256 numberOfToken) public payable {
        // check if thic fucntion caller is not an zero address account
        require(openForPublic == true, "not open");
        require(msg.sender != address(0));
        require(
            _allTokens.length + numberOfToken <= maxSupply,
            "max supply"
        );
        require(numberOfToken > 0, "Min 1");
        require(numberOfToken <= 12, "Max 12");
        uint256 price = 0;
        // pay for minting cost
        if (excludedList[msg.sender] == false) {
            // send token"s worth of ethers to the owner
            price = mintFeeAmount * numberOfToken;
            // require(msg.value == price, "Not enough fee");
            // payable(_royaltiesAddr).transfer(msg.value);
        } else {
            // return money to sender // since its free
            payable(msg.sender).transfer(msg.value);
        }

        for (uint256 i = 1; i <= numberOfToken; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            _safeMint(msg.sender, newItemId);
            PlayersObj memory newPlayersObj = PlayersObj(
                newItemId,
                msg.sender,
                msg.sender,
                0,
                price,
                0,
                false,
                100
            );
            // add the token id to the allPlayers
            allPlayers[newItemId] = newPlayersObj;
        }
    }

    function test() public view returns(uint32){
        return 1;
    }


    function changeUrl(string memory url) external {
        require(msg.sender == _owner, "Only owner");
        baseURL = url;
    }

    function totalSupply() public view returns (uint256) {
        return _allTokens.length;
    }


    function setPriceForSale(
        uint256 _tokenId,
        uint256 _newPrice,
        bool isForSale
    ) external {
        require(_exists(_tokenId), "token not found");
        address tokenOwner = ownerOf(_tokenId);
        require(tokenOwner == msg.sender, "not owner");
        PlayersObj memory player = allPlayers[_tokenId];
        player.price = _newPrice;
        player.forSale = isForSale;
        allPlayers[_tokenId] = player;
        emit SaleToggle(_tokenId, isForSale, _newPrice);
    }

    function getAllSaleTokens() public view returns (uint256[] memory) {
        uint256 _totalSupply = totalSupply();
        uint256[] memory _tokenForSales = new uint256[](_totalSupply);
        uint256 counter = 0;
        for (uint256 i = 1; i <= _totalSupply; i++) {
            if (allPlayers[i].forSale == true) {
                _tokenForSales[counter] = allPlayers[i].tokenId;
                counter++;
            }
        }
        return _tokenForSales;
    }

    // by a token by passing in the token"s id
    function buyToken(uint256 _tokenId) public payable {
        // check if the token id of the token being bought exists or not
        require(_exists(_tokenId));

        address tokenOwner = ownerOf(_tokenId);
        // token"s owner should not be an zero address account
        require(tokenOwner != address(0));
        // the one who wants to buy the token should not be the token"s owner
        require(tokenOwner != msg.sender);
        // get that token from all PlayersObj mapping and create a memory of it defined as (struct => PlayersObj)
        PlayersObj memory player = allPlayers[_tokenId];
        // price sent in to buy should be equal to or more than the token"s price
        require(msg.value >= player.price);
        // token should be for sale
        require(player.forSale);
        uint256 amount = msg.value;
        uint256 _royaltiesAmount = (amount * royaltyPercentage) / 100;
        uint256 payOwnerAmount = amount - _royaltiesAmount;
        payable(_royaltiesAddr).transfer(_royaltiesAmount);
        payable(player.currentOwner).transfer(payOwnerAmount);
        player.previousPrice = player.price;
        allPlayers[_tokenId] = player;
        _transfer(tokenOwner, msg.sender, _tokenId);
        emit PurchaseEvent(_tokenId, player.currentOwner, msg.sender, player.price);
    }

    function tokenOfOwnerByIndex(address owner, uint256 index)
        public
        view
        returns (uint256)
    {
        require(index < balanceOf(owner), "out of bounds");
        return _ownedTokens[owner][index];
    }

    function _baseURI()
        internal
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        return baseURL;
    }

    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
        PlayersObj memory player = allPlayers[tokenId];
        player.currentOwner = to;
        player.numberOfTransfers += 1;
        player.forSale = false;
        allPlayers[tokenId] = player;
        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }

    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId)
        private
    {
        uint256 lastTokenIndex = balanceOf(from) - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token"s index
        }

        // This also deletes the contents at the last position of the array
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }

    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        _allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token"s index

        // This also deletes the contents at the last position of the array
        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }


    mapping(address => bool) public authorized;

    modifier onlyAuthorized() {
        require(authorized[msg.sender] ||  msg.sender == _owner , "Not authorized");
        _;
    }

    function addAuthorized(address _toAdd) public {
        require(msg.sender == _owner, "Not owner");
        require(_toAdd != address(0));
        authorized[_toAdd] = true;
    }

    function removeAuthorized(address _toRemove) public {
        require(msg.sender == _owner, "Not owner");
        require(_toRemove != address(0));
        require(_toRemove != msg.sender);
        authorized[_toRemove] = false;
    }

    function setLvl(uint256 _tokenId, uint256 _newlvl) external onlyAuthorized {
        PlayersObj memory player = allPlayers[_tokenId];
        player.lvl = _newlvl;
        // set and update that token in the mapping
        allPlayers[_tokenId] = player;
    }
}
