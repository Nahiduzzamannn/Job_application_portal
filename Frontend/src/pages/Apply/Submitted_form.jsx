import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { applications, setAuthToken, getAuthToken } from "../../lib/api";

export default function SubmittedForm() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { subCategoryId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setLoading(false);
      navigate("/login");
      return;
    }

    fetchApplication(token);
  }, [navigate]);

  const fetchApplication = async (token) => {
    try {
      setLoading(true);
      setError(null);

      const data = await applications.getUserApplications();
      const appData = data.length > 0 ? data[0] : null;
      if (appData) {
        setApplication(appData);
        setFormData(appData);
        setIsEditing(false);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err.response?.data?.message || "Failed to fetch application");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    const token = getAuthToken();
    if (!token || !application?.id) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dataToSend = { ...formData };
      delete dataToSend.photo;
      delete dataToSend.signature;

      const updatedApplication = await applications.update(
        application.id,
        dataToSend
      );
      setApplication(updatedApplication);
      setFormData(updatedApplication);
      setIsEditing(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error("Update error:", err);
      setError(
        err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Failed to update application"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    const token = getAuthToken();
    if (!token || !application?.id) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await applications.partialUpdate(application.id, { is_submit: true });
      setApplication({ ...application, is_submit: true });
      setFormData({ ...formData, is_submit: true });
      navigate(`/payment/${application.subcategory}`);
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Failed to submit application"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    navigate("/categories");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className="text-center mt-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto">
          <strong className="font-bold">No application found!</strong>
          <span className="block sm:inline">
            {" "}
            Please login again or submit an application.
          </span>
        </div>
        <button
          onClick={() => navigate("/apply")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Create New Application
        </button>
      </div>
    );
  }

  const isSubmitted = application.is_submit;
  const isActive = application.is_active;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Application Details
        </h1>
        {!isSubmitted && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Edit Application
          </button>
        )}
      </div>

      {updateSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
          Application updated successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
          Error: {error}
        </div>
      )}

      {/* Application Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name (read-only) */}
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            type="text"
            name="student_name"
            value={formData.student_name || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Email (read-only) */}
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Date of Birth */}
        <div>
          <label className="block font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Gender */}
        <div>
          <label className="block font-medium mb-1">Gender</label>
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {/* Father's Name */}
        <div>
          <label className="block font-medium mb-1">Father's Name</label>
          <input
            type="text"
            name="father_name"
            value={formData.father_name || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Mother's Name */}
        <div>
          <label className="block font-medium mb-1">Mother's Name</label>
          <input
            type="text"
            name="mother_name"
            value={formData.mother_name || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Class */}
        <div>
          <label className="block font-medium mb-1">Class</label>
          <input
            type="text"
            name="student_class"
            value={formData.student_class || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Present Address */}
        <div className="md:col-span-2">
          <label className="block font-medium mb-1">Present Address</label>
          <textarea
            name="present_address"
            value={formData.present_address || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
        {/* Permanent Address */}
        <div className="md:col-span-2">
          <label className="block font-medium mb-1">Permanent Address</label>
          <textarea
            name="permanent_address"
            value={formData.permanent_address || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
        {/* Previous School */}
        <div className="md:col-span-2">
          <label className="block font-medium mb-1">Previous School</label>
          <input
            type="text"
            name="previous_school"
            value={formData.previous_school || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Mobile */}
        <div>
          <label className="block font-medium mb-1">Mobile</label>
          <input
            type="text"
            name="contact"
            value={formData.contact || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Save and Cancel Buttons */}
      {!isSubmitted && isEditing && (
        <div className="flex justify-between items-center mt-6">
          <div className="space-x-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData(application);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t text-sm text-gray-500">
        <p>
          <span className="font-medium">Submitted On:</span>{" "}
          {new Date(application.created_at).toLocaleString()}
        </p>
        {application.updated_at && (
          <p>
            <span className="font-medium">Last Updated:</span>{" "}
            {new Date(application.updated_at).toLocaleString()}
          </p>
        )}
        {isSubmitted && (
          <p className="text-green-600 font-medium">
            This application has been submitted
          </p>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-between mt-6">
        {!application.is_submit ? (
          <div className="flex flex-col">
            <button
              onClick={async () => {
                const token = getAuthToken();
                if (!token || !application?.id) {
                  navigate("/login");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  await applications.partialUpdate(application.id, {
                    is_submit: true,
                    is_active: true,
                  });
                  setApplication((prevApplication) => ({
                    ...prevApplication,
                    is_submit: true,
                    is_active: true,
                  }));
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    is_submit: true,
                    is_active: true,
                  }));
                  navigate(`/payment/${application.subcategory}`);
                  alert("Application submitted successfully!");
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              disabled={loading || isEditing}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
            <p className="text-red-500 text-sm mt-2">
              Once you submit, you can't make any changes later.
            </p>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/payment/${application.subcategory}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Proceed to Payment
          </button>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
