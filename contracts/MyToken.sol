//SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./ERC20.sol";


contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {}
    
    function testReturn4() public returns (uint){
        return 4;
    }
    
    function testReturnArray(uint len) public returns (uint[] memory arr){
        arr = new uint[](len);
        for(uint i = 0; i < len; i++){
            arr[i] = 5;
        }
    }
}
