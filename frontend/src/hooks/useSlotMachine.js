import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export const useSlotMachine = () => {
  const { signer, account, contractAddresses } = useWeb3();
  const [reels, setReels] = useState([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);
  const [playerStats, setPlayerStats] = useState({ spins: 0, winnings: 0, profit: 0 });
  const [jackpot, setJackpot] = useState(0);

  // Slot Machine ABI
  const SLOT_MACHINE_ABI = [
    "function spin(uint256 betAmount) external payable",
    "function getSymbolName(uint8 symbol) external pure returns (string memory)",
    "function getPlayerStats(address player) external view returns (uint256 spins, uint256 winnings, uint256 profit)",
    "function jackpot() external view returns (uint256)",
    "event SlotSpin(address indexed player, uint256 betAmount, uint8[3] reels, uint256 payout, uint256 timestamp)",
    "event JackpotWin(address indexed player, uint256 amount, uint256 timestamp)"
  ];

  const symbolNames = {
    0: "🍒", // CHERRY
    1: "🍋", // LEMON  
    2: "🍊", // ORANGE
    3: "🔔", // BELL
    4: "⭐", // STAR
    5: "💎", // DIAMOND
    6: "7️⃣"  // SEVEN
  };

  const spin = async (betAmount) => {
    if (!signer) throw new Error('Wallet not connected');

    setIsSpinning(true);
    try {
      const slotMachine = new ethers.Contract(contractAddresses.slotMachine, SLOT_MACHINE_ABI, signer);
      const betAmountWei = ethers.utils.parseEther(betAmount.toString());

      console.log('Spinning slots with bet:', betAmountWei.toString());

      const tx = await slotMachine.spin(betAmountWei, { 
        value: betAmountWei,
        gasLimit: 300000 
      });

      console.log('Spin transaction sent:', tx.hash);
      
      // Wait for transaction and get receipt with events
      const receipt = await tx.wait();
      console.log('Spin transaction confirmed:', receipt);

      // Find the SlotSpin event in the receipt
      const event = receipt.events?.find(e => e.event === 'SlotSpin');
      if (event) {
        const [player, bet, resultReels, payout] = event.args;
        
        // Convert reels from uint8[3] to array
        const reelsArray = [
          resultReels[0].toNumber(),
          resultReels[1].toNumber(), 
          resultReels[2].toNumber()
        ];
        
        setReels(reelsArray);
        setLastPayout(parseFloat(ethers.utils.formatEther(payout)));
        
        // Update stats
        await loadPlayerStats();
        await loadJackpot();
      }

      return receipt;
    } catch (error) {
      console.error('Error spinning slots:', error);
      throw error;
    } finally {
      setIsSpinning(false);
    }
  };

  const loadPlayerStats = async () => {
    if (!signer || !account) return;

    try {
      const slotMachine = new ethers.Contract(contractAddresses.slotMachine, SLOT_MACHINE_ABI, signer);
      const stats = await slotMachine.getPlayerStats(account);
      
      setPlayerStats({
        spins: stats.spins.toNumber(),
        winnings: parseFloat(ethers.utils.formatEther(stats.winnings)),
        profit: parseFloat(ethers.utils.formatEther(stats.profit))
      });
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const loadJackpot = async () => {
    if (!signer) return;

    try {
      const slotMachine = new ethers.Contract(contractAddresses.slotMachine, SLOT_MACHINE_ABI, signer);
      const jackpotWei = await slotMachine.jackpot();
      setJackpot(parseFloat(ethers.utils.formatEther(jackpotWei)));
    } catch (error) {
      console.error('Error loading jackpot:', error);
    }
  };

  const getSymbolDisplay = (symbolIndex) => {
    return symbolNames[symbolIndex] || '?';
  };

  const calculatePayout = (reels, betAmount) => {
    // Three of a kind
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      const multipliers = {
        0: 5,   // CHERRY
        1: 10,  // LEMON
        2: 15,  // ORANGE  
        3: 50,  // BELL
        4: 100, // STAR
        5: 250, // DIAMOND
        6: 1000 // SEVEN
      };
      return betAmount * (multipliers[reels[0]] || 0);
    }
    
    // Two of a kind (first two)
    if (reels[0] === reels[1]) {
      return betAmount * 2;
    }
    
    // Any seven
    if (reels.includes(6)) {
      return betAmount * 1; // 1x per seven
    }
    
    return 0;
  };

  // Initialize
  useEffect(() => {
    if (signer) {
      loadPlayerStats();
      loadJackpot();
    }
  }, [signer, account]);

  return {
    reels,
    isSpinning,
    lastPayout,
    playerStats,
    jackpot,
    spin,
    getSymbolDisplay,
    calculatePayout,
    loadPlayerStats,
    loadJackpot
  };
};