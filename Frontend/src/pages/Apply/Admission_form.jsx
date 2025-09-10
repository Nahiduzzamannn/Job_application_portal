import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applications, getAuthToken } from "../../lib/api";

export default function AdmissionForm() {
  const { subCategoryId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_name: "",
    dob: "",
    gender: "",
    student_class: "",
    father_name: "",
    mother_name: "",
    contact: "",
    email: "",
    previous_school: "",
    reason: "",
    present_address: "",
    permanent_address: "",
    is_submitted: false,
  });

  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const requiredFields = [
    "student_name",
    "dob",
    "gender",
    "student_class",
    "father_name",
    "mother_name",
    "contact",
    "email",
    "present_address",
    "permanent_address",
  ];

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
        isValid = false;
      }
    });

    if (!photo) {
      newErrors.photo = "Photo is required";
      isValid = false;
    }

    if (!signature) {
      newErrors.signature = "Signature is required";
      isValid = false;
    }

    if (formData.contact && !/^\d{10,11}$/.test(formData.contact)) {
      newErrors.contact = "Phone number must be 10-11 digits";
      isValid = false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
      isValid = false;
    }

    // Updated name validation to allow letters, spaces, and dots
    if (
      formData.student_name &&
      !/^[A-Za-z\s.]+$/.test(formData.student_name)
    ) {
      newErrors.student_name =
        "Name must contain only letters, spaces and dots";
      isValid = false;
    }

    if (formData.student_class && !/^\d+$/.test(formData.student_class)) {
      newErrors.student_class = "Class must be a number";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, [type]: "Only JPEG/PNG images allowed" });
      return;
    }

    if (file.size > maxSize) {
      setErrors({ ...errors, [type]: "File size must be less than 2MB" });
      return;
    }

    if (type === "photo") {
      setPhoto(file);
      setErrors({ ...errors, photo: "" });
    } else if (type === "signature") {
      setSignature(file);
      setErrors({ ...errors, signature: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append all data including files
      formDataToSend.append("subcategory_id", subCategoryId);
      formDataToSend.append("student_name", formData.student_name);
      formDataToSend.append("dob", formData.dob);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("student_class", formData.student_class);
      formDataToSend.append("father_name", formData.father_name);
      formDataToSend.append("mother_name", formData.mother_name);
      formDataToSend.append("contact", formData.contact);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("previous_school", formData.previous_school);
      formDataToSend.append("reason", formData.reason);
      formDataToSend.append("present_address", formData.present_address);
      formDataToSend.append("permanent_address", formData.permanent_address);
      formDataToSend.append("is_submitt", "false");

      if (photo) formDataToSend.append("photo", photo);
      if (signature) formDataToSend.append("signature", signature);

      const token = getAuthToken();
      if (!token) {
        alert("You are not logged in. Please log in first.");
        navigate("/login");
        return;
      }

      const response = await applications.create(formDataToSend);

      setSubmitSuccess(true);
      // Reset form
      setFormData({
        student_name: "",
        dob: "",
        gender: "",
        student_class: "",
        father_name: "",
        mother_name: "",
        contact: "",
        email: "",
        previous_school: "",
        reason: "",
        present_address: "",
        permanent_address: "",
        is_submitted: false,
      });
      setPhoto(null);
      setSignature(null);
      setErrors({});
    } catch (error) {
      console.error("Submission error:", error);
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      } else if (error.response?.data) {
        // Handle backend validation errors
        if (error.response.data.non_field_errors) {
          setServerError(error.response.data.non_field_errors.join(" "));
        } else {
          const backendErrors = error.response.data;
          const formattedErrors = {};

          Object.keys(backendErrors).forEach((key) => {
            formattedErrors[key] = Array.isArray(backendErrors[key])
              ? backendErrors[key].join(", ")
              : backendErrors[key];
          });

          setErrors(formattedErrors);
        }
      } else {
        setServerError(
          "Network error. Please check your connection and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLabel = (fieldName) => {
    const isRequired = requiredFields.includes(fieldName);
    return (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        {isRequired && <span className="text-red-600"> *</span>}
      </label>
    );
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">
            Application Submitted Successfully!
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Thank you for your application. We will contact you soon.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate(`/subcategories/${subCategoryId}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white text-center">
            School Admission Form
          </h2>
          <p className="text-blue-100 text-center mt-1">
            Please fill out all required fields marked with *
          </p>
        </div>

        {serverError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4">
            <p>{serverError}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {Object.keys(formData).map((field) => (
            <div
              key={field}
              className={
                field === "is_submitted"
                  ? "hidden"
                  : ["reason", "present_address", "permanent_address"].includes(
                      field
                    )
                  ? "md:col-span-2"
                  : ""
              }
            >
              {renderLabel(field)}
              {["reason", "present_address", "permanent_address"].includes(
                field
              ) ? (
                <textarea
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  rows={3}
                  className={`mt-1 block w-full border ${
                    errors[field] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required={requiredFields.includes(field)}
                />
              ) : field === "gender" ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.gender ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <input
                  type={
                    field === "dob"
                      ? "date"
                      : field === "email"
                      ? "email"
                      : field === "contact"
                      ? "tel"
                      : "text"
                  }
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  max={
                    field === "dob"
                      ? new Date().toISOString().split("T")[0]
                      : undefined
                  }
                  maxLength={field === "contact" ? "11" : undefined}
                  className={`mt-1 block w-full border ${
                    errors[field] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required={requiredFields.includes(field)}
                />
              )}
              {errors[field] && (
                <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
              )}
            </div>
          ))}

          <div>
            {renderLabel("photo")}
            <input
              type="file"
              accept="image/jpeg, image/png"
              onChange={(e) => handleFileChange(e, "photo")}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {errors.photo && (
              <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
            )}
            {photo && (
              <p className="mt-1 text-sm text-green-600">
                Photo selected: {photo.name}
              </p>
            )}
          </div>

          <div>
            {renderLabel("signature")}
            <input
              type="file"
              accept="image/jpeg, image/png"
              onChange={(e) => handleFileChange(e, "signature")}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {errors.signature && (
              <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
            )}
            {signature && (
              <p className="mt-1 text-sm text-green-600">
                Signature selected: {signature.name}
              </p>
            )}
          </div>

          <div className="md:col-span-2 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
