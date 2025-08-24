import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home/Home';
import Navbar from './components/Navbar/Navbar';
import BookDetails from './pages/BookDetails/BookDetails';
import Layout from './components/Layout/Layout';
import Borrowed from './pages/Borrowed/Borrowed';
import FillUpForm from './components/FillUpForm/FillUpForm';
import Dashboard from './pages/Dashboad/Dashboad';
import UploadBookPage from './components/Upload/UploadBookPage';
import AllGenres from './pages/AllGenres/AllGenres';
import ManageBooks from './pages/ManageBooks/ManageBooks';
import ManageCategory from './pages/ManageCategory/ManageCategory';
import ManageDonationRequests from './pages/ManageDonationRequests/ManageDonationRequests';
import ManageAuthor from './pages/ManageAuthor/ManageAuthor';
import AuthCallback from './pages/auth/AuthCallback';
import ProtectedRoute from './routes/ProtectedRoute';
import DashRouter from './routes/DashRouter';
import UserDashboard from './pages/User/UserDashboard';
import Logout from './pages/auth/Logout';
import MyLoansBlank from './pages/MyLoansBlank/MyLoansBlank';
import UserSettings from './pages/UserSettings/UserSettings';
import UserHistory from './pages/UserHistory/UserHistory';
import AdminSettings from './pages/AdminSettings/AdminSettings';
import ManageFeature from './pages/ManageFeature/ManageFeature';
import DonationRequest from './pages/DonationRequest/DonationRequest';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import { User } from 'lucide-react';
import Userdashboard from './pages/User/UserDashboard'
// import DonationRequest from './pages/DonationRequest/DonationRequest';


function App() {
  return (
    <BrowserRouter>
    < Navbar />
      <main className="flex-grow">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/book/:id" element={<BookDetails />} /> {/* <-- ADD THE NEW ROUTE */}
            <Route path="/borrowed" element={<Borrowed />} />
            <Route path="/fill-up-form/:id" element={<FillUpForm />} />
            <Route path="/upload" element={<UploadBookPage />} />
            <Route path="/all-genres" element={<AllGenres />} />
            <Route path="/manage-books" element={<ManageBooks />} />
            <Route path="/manage-category" element={<ManageCategory />} />
            <Route path="/manage-author" element={<ManageAuthor />} />
            <Route path="/manage-donation-request" element={<ManageDonationRequests />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/loans" element={<MyLoansBlank />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/history" element={<UserHistory />} />
            {/* <Route path="/setting" element={<AdminSettings />} /> */}
            <Route path="/manage-feature" element={<ManageFeature />} />
            <Route path="/admin-setting" element={<AdminSettings />} />
            <Route path="/donation-request" element={<DonationRequest />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/UserDashboard" element={<Userdashboard />} />
            {/* <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <DashRouter />
                </ProtectedRoute>
              }
            /> */}
            {/* <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            } /> */}

            {/* <Route path="/user" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserDashboard />
              </ProtectedRoute>
            } /> */}
          </Route>
          {/* <Route path="/logout" element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <Logout />
            </ProtectedRoute>
          } /> */}
        </Routes>
        
      </main>

    </BrowserRouter>
  );
}

export default App;




// // App.jsx
// import "./App.css";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// import Navbar from "./components/Navbar/Navbar";
// import Layout from "./components/Layout/Layout";

// import Home from "./pages/Home/Home";
// import BookDetails from "./pages/BookDetails/BookDetails";
// import Borrowed from "./pages/Borrowed/Borrowed";
// import FillUpForm from "./components/FillUpForm/FillUpForm";
// import Dashboard from "./pages/Dashboad/Dashboad";
// import UploadBookPage from "./components/Upload/UploadBookPage";
// import AllGenres from "./pages/AllGenres/AllGenres";
// import ManageBooks from "./pages/ManageBooks/ManageBooks";
// import ManageCategory from "./pages/ManageCategory/ManageCategory";

// function App() {
//   return (
//     <BrowserRouter>
//       <Navbar />
//       <main className="flex-grow">
//         <Routes>
//           {/* Wrap everything with your Layout */}
//           <Route element={<Layout />}>
//             {/* Canonical routes */}
//             <Route path="/" element={<Home />} />
//             <Route path="/book/:id" element={<BookDetails />} />
//             <Route path="/borrowed" element={<Borrowed />} />
//             <Route path="/fill-up-form" element={<FillUpForm />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/upload" element={<UploadBookPage />} />
//             <Route path="/all-genres" element={<AllGenres />} />
//             <Route path="/manage-books" element={<ManageBooks />} />
//             <Route path="/manage-category" element={<ManageCategory />} />

//             {/* ---- QUICK ALIASES so /admin/* also works ---- */}
//             <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
//             <Route path="/admin/dashboard" element={<Dashboard />} />
//             <Route path="/admin/borrowed" element={<Borrowed />} />
//             <Route path="/admin/fill-up-form" element={<FillUpForm />} />
//             <Route path="/admin/upload" element={<UploadBookPage />} />
//             <Route path="/admin/all-genres" element={<AllGenres />} />
//             <Route path="/admin/manage-books" element={<ManageBooks />} />
//             <Route path="/admin/manage-category" element={<ManageCategory />} />

//             {/* Fallbacks */}
//             <Route path="*" element={<Navigate to="/dashboard" replace />} />
//           </Route>
//         </Routes>
//       </main>
//     </BrowserRouter>
//   );
// }

// export default App;
