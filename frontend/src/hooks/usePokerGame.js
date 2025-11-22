import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export const usePokerGame = () => {
  const { signer, account, contractAddresses, provider } = useWeb3();
  const [currentGame, setCurrentGame] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [gameState, setGameState] = useState('lobby');
  const [currentBet, setCurrentBet] = useState(0);
  const [playerBalance, setPlayerBalance] = useState(0);
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(false);

  // Poker Game ABI - Updated with proper functions
  const POKER_GAME_ABI = [
    // Game Management
    "function createGame(bytes32 gameId, uint256 buyIn, uint256 maxPlayers, uint256 smallBlind, uint256 bigBlind) external payable",
    "function joinGame(bytes32 gameId) external payable",
    "function takeAction(bytes32 gameId, uint8 action, uint256 raiseAmount) external payable",
    "function claimWinnings() external",
    
    // View Functions
    "function getGameInfo(bytes32 gameId) external view returns (address[] players, uint256 buyIn, uint256 pot, uint256 state, uint256 startTime, uint256 maxPlayers, address currentPlayer, uint256 currentBet)",
    "function getPlayerInfo(bytes32 gameId, address player) external view returns (uint256 balance, bool hasFolded, bool isAllIn, bytes32[] hand)",
    "function getPlayerWinnings(address player) external view returns (uint256)",
    
    // Events
    "event GameCreated(bytes32 indexed gameId, address creator, uint256 buyIn, uint256 maxPlayers)",
    "event PlayerJoined(bytes32 indexed gameId, address player, uint256 amount)",
    "event PlayerActionTaken(bytes32 indexed gameId, address player, uint8 action, uint256 amount)",
    "event GameCompleted(bytes32 indexed gameId, address winner, uint256 prize)",
    "event CardsDealt(bytes32 indexed gameId, address player, bytes32[] cards)"
  ];

  // Create a new poker game
  const createGame = async (gameName, buyIn, maxPlayers, smallBlind, bigBlind) => {
    if (!signer) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const pokerGame = new ethers.Contract(contractAddresses.pokerGame, POKER_GAME_ABI, signer);
      
      // Generate a unique game ID
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(gameName + Date.now() + account));
      const buyInWei = ethers.utils.parseEther(buyIn.toString());
      const smallBlindWei = ethers.utils.parseEther(smallBlind.toString());
      const bigBlindWei = ethers.utils.parseEther(bigBlind.toString());

      console.log('Creating game with ID:', gameId);
      console.log('Buy-in:', buyInWei.toString());
      console.log('Blinds:', smallBlindWei.toString(), bigBlindWei.toString());

      const tx = await pokerGame.createGame(
        gameId,
        buyInWei,
        maxPlayers,
        smallBlindWei,
        bigBlindWei,
        { value: buyInWei, gasLimit: 500000 }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setCurrentGame(gameId);
      setGameState('waiting');
      
      // Listen for game events
      setupGameListeners(pokerGame, gameId);
      
      return gameId;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Join an existing game
  const joinGame = async (gameId, buyIn) => {
    if (!signer) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const pokerGame = new ethers.Contract(contractAddresses.pokerGame, POKER_GAME_ABI, signer);
      const buyInWei = ethers.utils.parseEther(buyIn.toString());

      console.log('Joining game with ID:', gameId);
      console.log('Buy-in:', buyInWei.toString());

      // Validate gameId is a proper bytes32 value
      if (!ethers.utils.isHexString(gameId, 32)) {
        throw new Error('Invalid game ID format');
      }

      const tx = await pokerGame.joinGame(gameId, { 
        value: buyInWei,
        gasLimit: 300000 
      });

      console.log('Join transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Join transaction confirmed:', receipt);

      setCurrentGame(gameId);
      setGameState('playing');
      
      // Setup listeners and load initial state
      setupGameListeners(pokerGame, gameId);
      await loadGameState(gameId);
      
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Take action in current game
  const takeAction = async (action, raiseAmount = 0) => {
    if (!signer || !currentGame) throw new Error('No active game');

    setLoading(true);
    try {
      const pokerGame = new ethers.Contract(contractAddresses.pokerGame, POKER_GAME_ABI, signer);
      const raiseAmountWei = ethers.utils.parseEther(raiseAmount.toString());

      console.log('Taking action:', action, 'Raise amount:', raiseAmountWei.toString());

      const tx = await pokerGame.takeAction(
        currentGame, 
        action, 
        raiseAmountWei,
        { gasLimit: 300000 }
      );

      await tx.wait();
      await loadGameState(currentGame);
      
    } catch (error) {
      console.error('Error taking action:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load current game state
  const loadGameState = async (gameId) => {
    if (!signer || !gameId) return;

    try {
      const pokerGame = new ethers.Contract(contractAddresses.pokerGame, POKER_GAME_ABI, signer);
      
      const gameInfo = await pokerGame.getGameInfo(gameId);
      const playerInfo = await pokerGame.getPlayerInfo(gameId, account);

      console.log('Game info:', gameInfo);
      console.log('Player info:', playerInfo);

      setCurrentBet(parseFloat(ethers.utils.formatEther(gameInfo.currentBet)));
      setPlayerBalance(parseFloat(ethers.utils.formatEther(playerInfo.balance)));
      
      // Convert bytes32 hand to card representations
      if (playerInfo.hand && playerInfo.hand.length > 0) {
        const hand = playerInfo.hand.map(cardBytes => 
          bytes32ToCard(cardBytes)
        );
        setPlayerHand(hand);
      } else {
        setPlayerHand([]);
      }

      // Update game state
      const states = ['waiting', 'playing', 'completed', 'cancelled'];
      setGameState(states[gameInfo.state] || 'unknown');

    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };

  // Discover active games (simplified - in production you'd use events)
  const discoverActiveGames = async () => {
    if (!provider) return;

    try {
      // For now, return mock data. In production, you'd query blockchain events
      const mockGames = [
        {
          id: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("High Rollers " + Date.now())),
          name: 'High Rollers Table',
          buyIn: '0.1',
          players: 2,
          maxPlayers: 6,
          smallBlind: '0.005',
          bigBlind: '0.01',
          pot: '0.2'
        },
        {
          id: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Beginner Table " + Date.now())),
          name: 'Beginner Table',
          buyIn: '0.01',
          players: 1,
          maxPlayers: 6,
          smallBlind: '0.001',
          bigBlind: '0.002',
          pot: '0.01'
        }
      ];

      setActiveGames(mockGames);
    } catch (error) {
      console.error('Error discovering games:', error);
    }
  };

  // Setup event listeners for game
  const setupGameListeners = (pokerGame, gameId) => {
    // Player joined event
    pokerGame.on('PlayerJoined', (eventGameId, player, amount) => {
      if (eventGameId === gameId) {
        console.log('Player joined:', player, 'Amount:', amount.toString());
        loadGameState(gameId);
      }
    });

    // Player action event
    pokerGame.on('PlayerActionTaken', (eventGameId, player, action, amount) => {
      if (eventGameId === gameId) {
        console.log('Player action:', player, 'Action:', action, 'Amount:', amount.toString());
        loadGameState(gameId);
      }
    });

    // Cards dealt event
    pokerGame.on('CardsDealt', (eventGameId, player, cards) => {
      if (eventGameId === gameId && player === account) {
        console.log('Cards dealt to player:', cards);
        const hand = cards.map(cardBytes => bytes32ToCard(cardBytes));
        setPlayerHand(hand);
      }
    });
  };

  // Convert bytes32 to card representation
  const bytes32ToCard = (cardBytes) => {
    try {
      const suits = ['♠', '♥', '♦', '♣'];
      const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      
      const hash = ethers.utils.hexlify(cardBytes);
      const suitIndex = parseInt(hash.slice(2, 4), 16) % 4;
      const valueIndex = parseInt(hash.slice(4, 6), 16) % 13;
      
      return {
        value: values[valueIndex],
        suit: suits[suitIndex],
        display: values[valueIndex] + suits[suitIndex]
      };
    } catch (error) {
      console.error('Error converting card:', error);
      return { value: '?', suit: '?', display: '??' };
    }
  };

  // Claim winnings
  const claimWinnings = async () => {
    if (!signer) throw new Error('Wallet not connected');

    try {
      const pokerGame = new ethers.Contract(contractAddresses.pokerGame, POKER_GAME_ABI, signer);
      const tx = await pokerGame.claimWinnings({ gasLimit: 200000 });
      await tx.wait();
      
      // Reload game state
      if (currentGame) {
        await loadGameState(currentGame);
      }
    } catch (error) {
      console.error('Error claiming winnings:', error);
      throw error;
    }
  };

  // Initialize
  useEffect(() => {
    if (provider) {
      discoverActiveGames();
    }
  }, [provider]);

  return {
    currentGame,
    playerHand,
    communityCards,
    gameState,
    currentBet,
    playerBalance,
    activeGames,
    loading,
    createGame,
    joinGame,
    takeAction,
    loadGameState,
    claimWinnings,
    discoverActiveGames
  };
};