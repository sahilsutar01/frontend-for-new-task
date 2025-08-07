import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Wallet, isAddress, parseEther, formatEther, JsonRpcProvider, Contract,
    formatUnits, parseUnits, Mnemonic
} from "ethers";
import { Toaster, toast } from "react-hot-toast";
import clsx from "clsx";
import QRCode from "react-qr-code";
import "./App.css";

// --- ICONS ---
const SendIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 12.5L19.5 5.5L12.5 20.5L10.5 14.5L4.5 12.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 14L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const HistoryIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ContactsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 21V19C22.9992 17.9832 22.5972 17.0114 21.8797 16.294C21.1623 15.5765 20.1904 15.1745 19.174 15.174" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13C16.5264 3.58751 16.9378 4.16462 17.2 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const SecurityIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 11L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8.00001L12.01 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.9992 12C20.9992 17.5228 16.522 22 10.9992 22C5.47635 22 1 17.5228 1 12C1 6.47715 5.47635 2 10.9992 2C16.522 2 20.9992 6.47715 20.9992 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const RefreshIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 9A9 9 0 0 1 21.5 9.99" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 15A9 9 0 0 1 2.5 14.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// --- CONFIGURATION ---
const RPC_URL = "https://bsc-testnet-dataseed.bnbchain.org";
const API_URL = "https://backend-for-new-task.onrender.com";
const USDT_CONTRACT_ADDRESS = "0x787A697324dbA4AB965C58CD33c13ff5eeA6295F";
const USDC_CONTRACT_ADDRESS = "0x342e3aA1248AB77E319e3331C6fD3f1F2d4B36B1";

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)","function transfer(address to, uint256 amount) returns (bool)","function decimals() view returns (uint8)","function name() view returns (string)","function symbol() view returns (string)","event Transfer(address indexed from, address indexed to, uint256 value)",
];

// --- MODAL & LOADING COMPONENTS ---
const QrModal = ({ address, onClose }) => (
    <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Wallet Address</h3>
            <div className="qr-container"><QRCode value={address} size={256} bgColor="#FFFFFF" fgColor="#0D0C13" /></div>
            <p className="modal-address">{address}</p>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
    </div>
);

const ContactsModal = ({ contacts, onSelect, onClose }) => (
    <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Select a Contact</h3>
            <ul className="contacts-modal-list">
                {contacts.length > 0 ? contacts.map(contact => (
                    <li key={contact._id} onClick={() => onSelect(contact.contactAddress)}>
                        <strong>{contact.contactName}</strong>
                        <span>{contact.contactAddress}</span>
                    </li>
                )) : <p>No contacts found. Add one in the Contacts tab.</p>}
            </ul>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
    </div>
);

const LoadingSpinner = () => <div className="spinner"></div>;
const PageLoader = () => <div className="page-loader"><LoadingSpinner /></div>;

// --- BALANCES CARD COMPONENT ---
const BalancesCard = ({ bnb, usdt, usdc, onRefresh, isLoading }) => (
    <div className="balances-card">
        <div className="balances-header">
            <h3>Token Balances</h3>
            <button onClick={onRefresh} className="btn-icon" disabled={isLoading}><RefreshIcon /></button>
        </div>
        <div className="balance-item"><span className="token-name">BNB</span><span className="token-value">{bnb ? parseFloat(bnb).toFixed(5) : "…"}</span></div>
        <div className="balance-item"><span className="token-name">USDT</span><span className="token-value">{usdt ? parseFloat(usdt).toFixed(2) : "…"}</span></div>
        <div className="balance-item"><span className="token-name">USDC</span><span className="token-value">{usdc ? parseFloat(usdc).toFixed(2) : "…"}</span></div>
    </div>
);

// --- MAIN APP ---
export default function App() {
    const [mode, setMode] = useState("fetch");
    const [walletName, setWalletName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [walletData, setWalletData] = useState(() => {
        try {
            const savedWallet = localStorage.getItem('walletData');
            if (savedWallet) {
                return JSON.parse(savedWallet);
            }
            return null;
        } catch (error) {
            console.error("Failed to parse wallet data from local storage", error);
            return null;
        }
    });

    const [balance, setBalance] = useState(null);
    const [usdtBalance, setUsdtBalance] = useState(null);
    const [usdcBalance, setUsdcBalance] = useState(null);
    const [activeTab, setActiveTab] = useState("send");
    const [qrOpen, setQrOpen] = useState(false);
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [sendToken, setSendToken] = useState("BNB");
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [revealInput, setRevealInput] = useState("");
    const [showSensitive, setShowSensitive] = useState(false);
    const [mnemonicInput, setMnemonicInput] = useState("");
    const [contacts, setContacts] = useState([]);
    const [newContactName, setNewContactName] = useState("");
    const [newContactAddress, setNewContactAddress] = useState("");
    const [isContactModalOpen, setContactModalOpen] = useState(false);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    const provider = useMemo(() => new JsonRpcProvider(RPC_URL), []);

    const fetchAllBalances = useCallback(async (address) => {
        setIsBalanceLoading(true);
        try {
            const bnbBal = await provider.getBalance(address); setBalance(formatEther(bnbBal));
            const usdt = new Contract(USDT_CONTRACT_ADDRESS, ERC20_ABI, provider); setUsdtBalance(formatUnits(await usdt.balanceOf(address), await usdt.decimals()));
            const usdc = new Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, provider); setUsdcBalance(formatUnits(await usdc.balanceOf(address), await usdc.decimals()));
            toast.success("Balances refreshed!");
        } catch (e) { console.error(e); toast.error("Failed to fetch balances."); }
        finally { setIsBalanceLoading(false); }
    }, [provider]);

    const handleAction = async () => {
        setLoading(true);
        try {
            if (mode === "create") {
                if (!walletName.trim() || !password.trim()) return toast.error("Wallet Name and Password are required.");
                if (password !== confirmPw) return toast.error("Passwords don’t match.");
                const wallet = Wallet.createRandom(); const payload = { name: walletName, address: wallet.address, privateKey: wallet.privateKey, mnemonic: wallet.mnemonic.phrase, password };
                const res = await fetch(`${API_URL}/api/wallet`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (res.ok) {
                    toast.success("Wallet created & saved!");
                    setWalletName(""); setPassword(""); setConfirmPw("");
                    setMode("fetch");
                } else {
                    const { error } = await res.json(); toast.error(error || "Save failed");
                    setPassword(""); setConfirmPw("");
                }
            } else if (mode === 'import') {
                if (!walletName.trim() || !mnemonicInput.trim()) return toast.error("Wallet Name and Mnemonic are required.");
                if (password && password !== confirmPw) return toast.error("Passwords do not match.");
                if (!Mnemonic.isValidMnemonic(mnemonicInput.trim())) return toast.error("Invalid Mnemonic Phrase.");
                const importedWallet = Wallet.fromPhrase(mnemonicInput.trim()); const payload = { name: walletName, address: importedWallet.address, privateKey: importedWallet.privateKey, mnemonic: importedWallet.mnemonic.phrase, password: password || "" };
                const res = await fetch(`${API_URL}/api/wallet`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (res.ok) {
                    toast.success("Wallet imported and saved!");
                    setWalletName(""); setPassword(""); setConfirmPw(""); setMnemonicInput("");
                    setMode("fetch");
                } else {
                    const { error } = await res.json(); toast.error(error || "Save failed.");
                    setPassword(""); setConfirmPw("");
                }
            } else {
                if (!walletName.trim()) {
                    setLoading(false);
                    return toast.error("Wallet Name is required.");
                }
                const res = await fetch(`${API_URL}/api/wallet/${walletName}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
                const data = await res.json();
                if (data.error) {
                    toast.error(data.error);
                } else {
                    toast.success(`Wallet "${data.name}" loaded!`);
                    setWalletData(data);
                }
            }
        } catch (err) { console.error(err); toast.error("An unexpected network error occurred."); }
        finally { setLoading(false); }
    };

    const handleSend = async () => {
        if (!walletData || !isAddress(recipient) || !amount || parseFloat(amount) <= 0) {
            toast.error("Please ensure all fields are valid."); return;
        }
        setLoading(true); const toastId = toast.loading("Submitting transaction...");
        try {
            const signer = new Wallet(walletData.privateKey, provider);
            const tx = sendToken === "BNB" ? await signer.sendTransaction({ to: recipient, value: parseEther(amount) }) : await (async () => {
                const contractAddress = sendToken === "USDT" ? USDT_CONTRACT_ADDRESS : USDC_CONTRACT_ADDRESS;
                const tokenContract = new Contract(contractAddress, ERC20_ABI, signer);
                const decimals = await tokenContract.decimals();
                return tokenContract.transfer(recipient, parseUnits(amount, decimals));
            })();
            toast.loading(<span><b>Transaction Submitted!</b><br/>Waiting for confirmation...</span>, { id: toastId });
            await tx.wait();
            toast.success(<span><b>Transaction Confirmed!</b><br/><a href={`https://testnet.bscscan.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">View on BscScan</a></span>, { id: toastId, duration: 8000 });
            try {
                await fetch(`${API_URL}/api/tx/${tx.hash}`, { method: 'POST' });
            } catch (logError) {
                console.error("Failed to log transaction:", logError);
                toast.error("Transaction succeeded but failed to log to history.");
            }
            setAmount(""); setRecipient("");
            fetchAllBalances(walletData.address); if (activeTab === 'history') fetchHistory();
        } catch (e) { toast.error(e?.reason || e?.message || "Transaction failed", { id: toastId }); }
        finally { setLoading(false); }
    };

    const fetchHistory = useCallback(async () => {
        if (!walletData) return;
        setHistoryLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/history/${walletData.address}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch history.");
            setHistory(data);
        } catch (e) {
            toast.error(e.message); console.error(e);
        }
        finally { setHistoryLoading(false); }
    }, [walletData]);

    const fetchContacts = useCallback(async () => {
        if (!walletData) return;
        try {
            const res = await fetch(`${API_URL}/api/contacts/${walletData.address}`); const data = await res.json();
            if (!res.ok) throw new Error(data.error); setContacts(data);
        } catch (e) { toast.error("Could not load contacts."); }
    }, [walletData]);

    const handleAddContact = async () => {
        if (!newContactName.trim() || !isAddress(newContactAddress)) return toast.error("Valid name and address required.");
        const payload = { walletAddress: walletData.address, contactName: newContactName, contactAddress: newContactAddress };
        try {
            const res = await fetch(`${API_URL}/api/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to add contact');
            toast.success("Contact added!"); setNewContactName(""); setNewContactAddress(""); fetchContacts();
        } catch (e) { toast.error(e.message); }
    };

    const handleDeleteContact = async (contactId) => {
        if (!window.confirm("Delete this contact?")) return;
        try {
            const res = await fetch(`${API_URL}/api/contacts/${contactId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete contact');
            toast.success("Contact deleted."); fetchContacts();
        } catch (e) { toast.error(e.message); }
    };

    useEffect(() => {
        if (walletData) {
            localStorage.setItem('walletData', JSON.stringify(walletData));
            fetchAllBalances(walletData.address);
        } else {
            localStorage.removeItem('walletData');
            setBalance(null); 
            setUsdtBalance(null); 
            setUsdcBalance(null); 
            setHistory([]); 
            setContacts([]);
        }
    }, [walletData, fetchAllBalances]);

    useEffect(() => {
        if (walletData && activeTab === 'history') { fetchHistory(); }
        if (walletData && activeTab === 'contacts') { fetchContacts(); }
    }, [activeTab, walletData, fetchHistory, fetchContacts]);

    const handleLogout = () => {
        toast.success("Wallet locked!");
        setWalletData(null); 
        setPassword(''); 
        setWalletName(''); 
        setConfirmPw(''); 
        setMnemonicInput(''); 
    }

    // --- PRE-LOGIN VIEW ---
    if (!walletData) {
        return (
            <div className="prelogin-page">
                <Toaster position="bottom-center" toastOptions={{ className: 'toast-custom' }}/>
                <div className="prelogin-layout">
                    <div className="prelogin-info-panel">
                        <h1 className="main-title">ZENITH VAULT</h1>
                        <p className="main-subtitle">Your Decentralized Crypto Wallet. Secure, Fast, and User-Friendly.</p>
                        <div className="features-list">
                            <span>✓ Create & Import Wallets</span>
                            <span>✓ Send & Receive Tokens</span>
                            <span>✓ Full Transaction History</span>
                            <span>✓ Securely Managed</span>
                        </div>
                    </div>
                    <div className="prelogin-form-panel">
                        <div className="mode-switch">
                            <button className={clsx('mode-btn', { active: mode === "create" })} onClick={() => setMode("create")}>Create</button>
                            <button className={clsx('mode-btn', { active: mode === "fetch" })} onClick={() => setMode("fetch")}>Access</button>
                            <button className={clsx('mode-btn', { active: mode === "import" })} onClick={() => setMode("import")}>Import</button>
                        </div>
                        <div className="form-content">
                            <div className="input-group">
                                {mode === 'import' && (
                                    <textarea placeholder="Enter 12-word Mnemonic Phrase..." value={mnemonicInput} onChange={(e) => setMnemonicInput(e.target.value)} rows={3}/>
                                )}
                                <input placeholder="Wallet Name" value={walletName} onChange={(e) => setWalletName(e.target.value)} />
                                {mode !== 'import' && (
                                    <input type="password" placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                                )}
                                {mode === 'create' && (
                                    <input type="password" placeholder='Confirm Password' value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}/>
                                )}
                                {mode === 'import' && (
                                    <>
                                        <input type="password" placeholder='New Password (Optional)' value={password} onChange={(e) => setPassword(e.target.value)}/>
                                        <input type="password" placeholder='Confirm Password' value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}/>
                                    </>
                                )}
                            </div>
                            <button className="btn btn-primary" onClick={handleAction} disabled={loading}>{loading ? <LoadingSpinner /> : (mode === 'fetch' ? 'Unlock Wallet' : 'Continue')}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- LOGGED-IN VIEW ---
    return (
        <div className="app-layout">
            <Toaster position="bottom-center" toastOptions={{ className: 'toast-custom' }}/>
            {qrOpen && <QrModal address={walletData.address} onClose={() => setQrOpen(false)} />}
            {isContactModalOpen && <ContactsModal contacts={contacts} onClose={() => setContactModalOpen(false)} onSelect={(address) => { setRecipient(address); setContactModalOpen(false); }} />}
            <header className="app-header">
                <div className="header-wallet-info">
                    <span className="header-wallet-name">{walletData.name}</span>
                    <div className="header-address-bar">
                        <span>{`${walletData.address.slice(0, 10)}...${walletData.address.slice(-8)}`}</span>
                        <button onClick={() => setQrOpen(true)} title="Show QR Code">QR</button>
                        <button onClick={() => navigator.clipboard.writeText(walletData.address).then(() => toast.success('Address copied!'))} title="Copy Address">Copy</button>
                    </div>
                </div>
                <div className="header-actions"><button className="btn-lock" onClick={handleLogout}><LogoutIcon /> Lock Wallet</button></div>
            </header>
            <main className="app-main-content">
                <div className="content-container">
                    <div className="main-tabs">
                        <button className={clsx({active: activeTab === 'send'})} onClick={() => setActiveTab('send')}><SendIcon /> Send</button>
                        <button className={clsx({active: activeTab === 'history'})} onClick={() => setActiveTab('history')}><HistoryIcon /> History</button>
                        <button className={clsx({active: activeTab === 'contacts'})} onClick={() => setActiveTab('contacts')}><ContactsIcon /> Contacts</button>
                        <button className={clsx({active: activeTab === 'security'})} onClick={() => setActiveTab('security')}><SecurityIcon /> Security</button>
                    </div>
                    <div className="tab-pane">
                        {activeTab === 'send' && (
                            <div className="send-grid">
                                <div className="send-form">
                                    <h2>🚀 Send Cryptocurrency</h2>
                                    <div className="form-grid">
                                        <div className="input-group full-width">
                                            <label>Recipient Address</label>
                                            <div className="address-input-wrapper"><input placeholder="Enter address or select from contacts" value={recipient} onChange={(e) => setRecipient(e.target.value)} /><button className="btn-address-book" title="Open Contacts" onClick={() => { if(contacts.length === 0) fetchContacts(); setContactModalOpen(true); }}><ContactsIcon /></button></div>
                                        </div>
                                        <div className="input-group"><label>Amount</label><input placeholder="0.0" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                                        <div className="input-group"><label>Token</label><select value={sendToken} onChange={(e) => setSendToken(e.target.value)}><option value="BNB">BNB</option><option value="USDT">USDT</option><option value="USDC">USDC</option></select></div>
                                    </div>
                                    <button className="btn btn-primary" onClick={handleSend} disabled={loading || !recipient || !amount}>{loading ? <LoadingSpinner /> : `Send ${sendToken}`}</button>
                                </div>
                                <BalancesCard bnb={balance} usdt={usdtBalance} usdc={usdcBalance} onRefresh={() => fetchAllBalances(walletData.address)} isLoading={isBalanceLoading} />
                            </div>
                        )}
                        {activeTab === 'history' && ( <><h2>📜 Transaction History</h2>{historyLoading ? <PageLoader /> : (<ul className="history-list">{history.length > 0 ? history.map(tx => { const isSent = tx.from.toLowerCase() === walletData.address.toLowerCase(); return (<li key={tx.hash} className={isSent ? 'sent' : 'received'}><div className="tx-icon">{isSent ? <SendIcon/> : <HistoryIcon/>}</div><div className="tx-details"><strong>{isSent ? `Send ${tx.tokenName}` : `Receive ${tx.tokenName}`}</strong><p>{new Date(tx.timestamp).toLocaleString()}</p></div><div className="tx-amount"><span>{`${isSent ? '-' : '+'} ${parseFloat(tx.amount).toFixed(4)}`}</span><a href={`https://testnet.bscscan.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">View</a></div></li>)}) : <p className="empty-state">No transaction history.</p>}</ul>)}</> )}
                        {activeTab === 'contacts' && ( <><h2>👥 Address Book</h2><div className="contacts-layout"><div className="add-contact-form"><h4>Add New Contact</h4><div className="input-group"><label>Name</label><input placeholder="e.g. Savings" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} /></div><div className="input-group"><label>Address</label><input placeholder="0x..." value={newContactAddress} onChange={(e) => setNewContactAddress(e.target.value)} /></div><button className="btn btn-secondary" onClick={handleAddContact}>Save</button></div><div className="contacts-list-container"><h4>Saved Contacts</h4><ul className="contacts-list">{contacts.length > 0 ? contacts.map(c => (<li key={c._id}><div className="contact-info"><strong>{c.contactName}</strong><span>{c.contactAddress}</span></div><button className="btn-delete" onClick={() => handleDeleteContact(c._id)}>×</button></li>)) : <p className="empty-state">No contacts added.</p>}</ul></div></div></> )}
                        {activeTab === 'security' && ( <><h2>🔐 Security & Secrets</h2><div className="security-content"><p className="warning-text">Never share your Private Key or Mnemonic Phrase. Anyone with these can access your funds.</p><div className="input-group"><label>Enter Wallet Password to Reveal</label><input type="password" placeholder="Enter password..." value={revealInput} onChange={(e) => setRevealInput(e.target.value)} /></div><button className="btn btn-danger" onClick={() => {
                            if (showSensitive) { setShowSensitive(false); setRevealInput(""); return; }
                            // This uses the password stored in state when the user logged in.
                            // For enhanced security, you might re-ask for the password to store in `walletData`.
                            // However, this approach is simpler and works as per the original code's structure.
                            if (revealInput === password) { setShowSensitive(true); toast.success("Secrets Revealed!"); }
                            else { toast.error("Incorrect password!"); }
                            setRevealInput("");
                        }}>{showSensitive ? "Hide Secrets" : "Reveal Secrets"}</button>{showSensitive && (<div className="secrets-box"><div className="input-group"><label>Private Key</label><textarea readOnly value={walletData.privateKey} /></div><div className="input-group"><label>Mnemonic Phrase</label><textarea readOnly value={walletData.mnemonic} /></div></div>)}</div></> )}
                    </div>
                </div>
            </main>
        </div>
    );
}