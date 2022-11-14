//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PlayersV4.sol";
import "./BallV2.sol";

contract FootballGame {

    PlayersV4 public players;
    BallV2 public ballContract;

    mapping (uint => EnergyInfo) energy;

    uint[][] public registeredTeams;
    mapping (address => uint) private teamIndex;
    mapping (uint => address) private userOfTeam;


    enum MatchResult{Draw, AttackerWin, AttackerLose}

    event MatchHappened(uint[] attackerTeam, uint[] defenderTeam, uint[] playersResult, uint matchResult);

    struct EnergyInfo{
        uint128 lastTimestamp;
        uint128 lastAmount;
    }

    constructor(PlayersV4 _players, BallV2 _ballContract) {
        players = _players;
        ballContract = _ballContract;
    }

    function getRegisteredTeam(address adr) public view returns(uint[] memory team){
        team = registeredTeams[teamIndex[adr]];
    }

    function play(uint[] calldata team, uint betAmount) external returns(uint[] memory playersResult, uint matchResult){
        for (uint i = 0; i < team.length; i++) {
            require(players.ownerOf(team[i]) == msg.sender, "wrong players id");
        }

        require(ballContract.balanceOf(msg.sender) >= betAmount, "not enough BALLS for bet");

        playersResult = new uint[](5);
        int8 matchScore;

        uint[] memory opponentTeam = registeredTeams[uint256(keccak256(abi.encode(block.timestamp, block.number))) % registeredTeams.length];

        for (uint i = 0; i < 5; i++) {
            (, , , , , , , uint256 myPlayerLvl) = players.allPlayers(team[i]);
            (, , , , , , , uint256 opponentPlayerLvl) = players.allPlayers(opponentTeam[i]);
            uint myPoints = log2(myPlayerLvl/100 + 1) * (uint256(keccak256(abi.encode(block.timestamp, team[i]))) % 4 + 1);
            uint opponentPoints = log2(opponentPlayerLvl/100 + 1) * (uint256(keccak256(abi.encode(block.timestamp, opponentTeam[i]))) % 4 + 1);
            
            if(myPoints > opponentPoints) {
                playersResult[i] = 1;
                matchScore++;
            }
            if(myPoints < opponentPoints) {
                playersResult[i] = 2;
                matchScore--;
            }
        }

        if(matchScore > 0) matchResult = 1;
        if(matchScore < 0) matchResult = 2;

        // EnergyInfo memory info = energy[myId];
        // info.lastAmount = getEnergy(myId) - 10;
        // info.lastTimestamp = uint128(block.timestamp);
        // energy[myId] = info;

        if(matchResult == 1){
            ballContract.mintBall(msg.sender, betAmount);
        }
        if(matchResult == 2){
            ballContract.burnBalls(msg.sender, betAmount);
        }

        emit MatchHappened(team, opponentTeam, playersResult, matchResult);
    }

    function register(uint[] calldata team) external {
        for (uint i = 0; i < team.length; i++) {
            require(players.ownerOf(team[i]) == msg.sender, "wrong players id");
        }

        uint index = teamIndex[msg.sender];
        if(teamIndex[msg.sender] == 0){
            index = registeredTeams.length;
            registeredTeams.push(team);
        }

        userOfTeam[index] = msg.sender;
        teamIndex[msg.sender] = index;
    }

    function unregister() public {
        uint index = teamIndex[msg.sender];
        require(index != 0, "You are not registered any team");

        uint curCount = registeredTeams.length;

        if(curCount - 1 != index){
            uint[] memory lastTeam = registeredTeams[curCount - 1];
            address lastTeamUser = userOfTeam[curCount - 1];

            //Move last team to user slot
            userOfTeam[index] = lastTeamUser;
            teamIndex[lastTeamUser] = index;
            registeredTeams[index] = lastTeam;
        }

        registeredTeams.pop();
        delete userOfTeam[index];
        delete teamIndex[msg.sender];
        
    }

    function getEnergy(uint id) public view returns(uint128 amount){
        amount = energy[id].lastAmount + (uint128(block.timestamp) - energy[id].lastTimestamp)/864;
        if(amount > 100) {
            amount = 100;
        }
    }

    function log2(uint x) pure private returns (uint y){
        assembly {
            let arg := x
            x := sub(x,1)
            x := or(x, div(x, 0x02))
            x := or(x, div(x, 0x04))
            x := or(x, div(x, 0x10))
            x := or(x, div(x, 0x100))
            x := or(x, div(x, 0x10000))
            x := or(x, div(x, 0x100000000))
            x := or(x, div(x, 0x10000000000000000))
            x := or(x, div(x, 0x100000000000000000000000000000000))
            x := add(x, 1)
            let m := mload(0x40)
            mstore(m,           0xf8f9cbfae6cc78fbefe7cdc3a1793dfcf4f0e8bbd8cec470b6a28a7a5a3e1efd)
            mstore(add(m,0x20), 0xf5ecf1b3e9debc68e1d9cfabc5997135bfb7a7a3938b7b606b5b4b3f2f1f0ffe)
            mstore(add(m,0x40), 0xf6e4ed9ff2d6b458eadcdf97bd91692de2d4da8fd2d0ac50c6ae9a8272523616)
            mstore(add(m,0x60), 0xc8c0b887b0a8a4489c948c7f847c6125746c645c544c444038302820181008ff)
            mstore(add(m,0x80), 0xf7cae577eec2a03cf3bad76fb589591debb2dd67e0aa9834bea6925f6a4a2e0e)
            mstore(add(m,0xa0), 0xe39ed557db96902cd38ed14fad815115c786af479b7e83247363534337271707)
            mstore(add(m,0xc0), 0xc976c13bb96e881cb166a933a55e490d9d56952b8d4e801485467d2362422606)
            mstore(add(m,0xe0), 0x753a6d1b65325d0c552a4d1345224105391a310b29122104190a110309020100)
            mstore(0x40, add(m, 0x100))
            let magic := 0x818283848586878898a8b8c8d8e8f929395969799a9b9d9e9faaeb6bedeeff
            let shift := 0x100000000000000000000000000000000000000000000000000000000000000
            let a := div(mul(x, magic), shift)
            y := div(mload(add(m,sub(255,a))), shift)
            y := add(y, mul(256, gt(arg, 0x8000000000000000000000000000000000000000000000000000000000000000)))
        }  
    }
}

