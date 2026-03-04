import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import WalletScreen from './screens/WalletScreen';
import RefuelScreen from './screens/RefuelScreen';
import StatementsScreen from './screens/StatementsScreen';
import PaymentScreen from './screens/PaymentScreen';

// Hardcoded for prototype
export const CUSTOMER_ID = 1;
export const ACCOUNT_ID = 1;

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/refuel" element={<RefuelScreen />} />
          <Route path="/statements" element={<StatementsScreen />} />
          <Route path="/payment" element={<PaymentScreen />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
