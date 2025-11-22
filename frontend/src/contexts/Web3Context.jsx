import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastWallet, setLastWallet] = useState('');

  // Contract addresses (replace with your deployed addresses)
  const CONTRACT_ADDRESSES = {
    paymentProcessor: "0x66B6C2A7cF1bD7Abec4F5Aa42E9Bd07b99461C9E",
    pokerGame: "0x85491f3b09B663ECB1a989d67C34c742eb9aCbE5",
    slotMachine: "YOUR_SLOT_MACHINE_ADDRESS",
    blackjack: "YOUR_BLACKJACK_ADDRESS",
    soulboundToken: "0x..."
  };

  // Load saved wallet from localStorage on component mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('betfin_last_wallet');
    const savedNetwork = localStorage.getItem('betfin_network');
    
    if (savedWallet) {
      setLastWallet(savedWallet);
      // Auto-connect if we have a saved wallet and MetaMask is available
      if (window.ethereum) {
        checkSavedConnection(savedWallet);
      }
    }

    if (savedNetwork) {
      try {
        setNetwork(JSON.parse(savedNetwork));
      } catch (e) {
        console.error('Error parsing saved network:', e);
      }
    }
  }, []);

  const checkSavedConnection = async (savedWallet) => {
    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.listAccounts();
      
      if (accounts.length > 0 && accounts[0].toLowerCase() === savedWallet.toLowerCase()) {
        // Same wallet is still connected, restore connection
        await connectWallet(false); // silent reconnect
      }
    } catch (error) {
      console.log('No saved connection found:', error.message);
    }
  };

  const connectWallet = async (userInitiated = true) => {
    if (!window.ethereum) {
      if (userInitiated) {
        alert('Please install MetaMask!');
      }
      return;
    }

    setIsConnecting(true);
    try {
      // Switch to Polygon Amoy
      await switchToAmoyNetwork();
      
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Only request accounts if user initiated the connection
      if (userInitiated) {
        await web3Provider.send("eth_requestAccounts", []);
      }
      
      const web3Signer = web3Provider.getSigner();
      const userAddress = await web3Signer.getAddress();
      const userBalance = await web3Signer.getBalance();
      const currentNetwork = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAddress);
      setBalance(ethers.utils.formatEther(userBalance));
      setNetwork(currentNetwork);
      setIsConnected(true);

      // Save to localStorage
      localStorage.setItem('betfin_last_wallet', userAddress);
      localStorage.setItem('betfin_network', JSON.stringify({
        name: currentNetwork.name,
        chainId: currentNetwork.chainId
      }));

      setupEventListeners(web3Provider);
      
      console.log('Wallet connected:', userAddress);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (userInitiated) {
        alert('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToAmoyNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }], // Amoy chainId
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              rpcUrls: ['https://rpc-amoy.polygon.technology/'],
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              blockExplorerUrls: ['https://amoy.polygonscan.com/']
            }]
          });
        } catch (addError) {
          throw new Error('Failed to add Amoy network');
        }
      }
      throw switchError;
    }
  };

  const setupEventListeners = (web3Provider) => {
    // Remove existing listeners to prevent duplicates
    if (window.ethereum.removeAllListeners) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }

    // Account changed
    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        localStorage.setItem('betfin_last_wallet', accounts[0]);
        // Refresh connection with new account
        connectWallet(false);
      }
    });

    // Chain changed
    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      if (chainId !== '0x13882') {
        if (isConnected) {
          alert('Please switch back to Polygon Amoy Testnet to continue playing');
        }
      } else {
        // Refresh connection on correct network
        connectWallet(false);
      }
    });

    // Refresh balance periodically
    const balanceInterval = setInterval(async () => {
      if (account && provider) {
        try {
          const newBalance = await provider.getBalance(account);
          setBalance(ethers.utils.formatEther(newBalance));
        } catch (error) {
          console.error('Error updating balance:', error);
        }
      }
    }, 10000); // Update every 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(balanceInterval);
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount('');
    setBalance('0');
    setNetwork(null);
    setIsConnected(false);
    
    // Clear localStorage
    localStorage.removeItem('betfin_last_wallet');
    localStorage.removeItem('betfin_network');
    
    console.log('Wallet disconnected');
  };

  const checkConnection = async () => {
    if (!window.ethereum) return false;

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.listAccounts();
      
      if (accounts.length > 0) {
        const savedWallet = localStorage.getItem('betfin_last_wallet');
        if (savedWallet && accounts[0].toLowerCase() === savedWallet.toLowerCase()) {
          await connectWallet(false);
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
    
    return false;
  };

  // Check for existing connection on app start
  useEffect(() => {
    if (window.ethereum) {
      checkConnection();
    }
  }, []);

  const value = {
    provider,
    signer,
    account,
    balance,
    network,
    isConnecting,
    isConnected,
    lastWallet,
    connectWallet,
    disconnectWallet,
    checkConnection,
    contractAddresses: CONTRACT_ADDRESSES
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;