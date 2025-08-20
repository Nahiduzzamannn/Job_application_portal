import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CategoryList from "./pages/Apply/CategoryList";
import SubCategoryList from "./pages/Apply/SubCategoryList";
import Login from "./pages/Apply/Login";
import Signup from "./pages/Apply/Signup";
import ApplyForm from "./pages/Apply/Admission_form";
import SubmittedForm from "./pages/Apply/Submitted_form";
import Payment from "./pages/Apply/Payment";
import AdmitCard from "./pages/Apply/AdmitCard";
import Home from "./pages/Apply/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<CategoryList />} />

        

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* These routes use subCategoryId for application-related actions */}
        <Route path="/submitted/:subCategoryId" element={<SubmittedForm />} />
        <Route path="/apply/:subCategoryId" element={<ApplyForm />} />
        <Route path="/payment/:subCategoryId" element={<Payment />} />
        <Route path="/admit-card/:subCategoryId" element={<AdmitCard />} />
        {/* Subcategories are fetched based on category postId */}
        <Route path="/subcategories/:postId" element={<SubCategoryList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
