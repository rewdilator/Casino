import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export const useSlotMachine = () => {
  const { signer, account, contractAddresses } = useWeb3();
  const [reels, setReels] = useState([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);
  const [playerStats, setPlayerStats] = useState({ spins: 0, winnings: 0 });
  const [jackpot, setJackpot] = useState(0);

  // Simplified Slot Machine ABI
  const SLOT_MACHINE_ABI = [
    "function spin() external payable",
    "function jackpot() external view returns (uint256)",
    "function getPlayerStats(address player) external view returns (uint256 spins, uint256 winnings)",
    "event SlotSpin(address indexed player, uint256 betAmount, uint256 payout, uint256 timestamp)",
    "event JackpotWin(address indexed player, uint256 amount, uint256 timestamp)"
  ];

  const symbolNames = ["🍒", "🍋", "🍊", "🔔", "⭐", "💎", "7️⃣"];

  const spin = async (betAmount) => {
    if (!signer) throw new Error('Wallet not connected');

    setIsSpinning(true);
    try {
      const slotMachine = new ethers.Contract(contractAddresses.slotMachine, SLOT_MACHINE_ABI, signer);
      const betAmountWei = ethers.utils.parseEther(betAmount.toString());

      console.log('Spinning slots with bet:', betAmountWei.toString());

      const tx = await slotMachine.spin({ 
        value: betAmountWei,
        gasLimit: 300000 
      });

      console.log('Spin transaction sent:', tx.hash);
      
      // Generate visual reels while waiting
      const spinInterval = setInterval(() => {
        setReels([
          Math.floor(Math.random() * 7),
          Math.floor(Math.random() * 7),
          Math.floor(Math.random() * 7)
        ]);
      }, 100);

      const receipt = await tx.wait();
      clearInterval(spinInterval);
      
      console.log('Spin transaction confirmed:', receipt);

      // Set final reels (random for demo)
      setReels([
        Math.floor(Math.random() * 7),
        Math.floor(Math.random() * 7),
        Math.floor(Math.random() * 7)
      ]);

      // Find the SlotSpin event
      const event = receipt.events?.find(e => e.event === 'SlotSpin');
      if (event) {
        const payout = parseFloat(ethers.utils.formatEther(event.args.payout));
        setLastPayout(payout);
      }

      // Update stats
      await loadPlayerStats();
      await loadJackpot();

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
        winnings: parseFloat(ethers.utils.formatEther(stats.winnings))
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
      // If jackpot function doesn't exist, set to 0
      setJackpot(0);
    }
  };

  const getSymbolDisplay = (symbolIndex) => {
    return symbolNames[symbolIndex] || '?';
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
    loadPlayerStats,
    loadJackpot
  };
};