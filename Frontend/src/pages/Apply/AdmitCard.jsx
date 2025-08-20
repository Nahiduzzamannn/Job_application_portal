import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { usePDF } from "react-to-pdf";

function AdmitCard() {
  const { subCategoryId } = useParams();
  const [admitData, setAdmitData] = useState(null);
  const [seatPlanData, setSeatPlanData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const admitCardRef = useRef();
  const { toPDF, targetRef } = usePDF({ filename: "admit-card.pdf" });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !subCategoryId) {
      setError("Unauthorized or invalid subcategory.");
      setLoading(false);
      return;
    }

    // Fetch admit card data
    axios
      .get(`http://localhost:8000/api/admit-card/${subCategoryId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setAdmitData(res.data);
        
        // After getting admit data, fetch seat plan data if roll number exists
        if (res.data.roll_number) {
          return axios.get(`http://localhost:8000/api/seatplans/?roll=${res.data.roll_number}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
        return null;
      })
      .then((seatPlanRes) => {
        if (seatPlanRes && seatPlanRes.data && seatPlanRes.data.length > 0) {
          setSeatPlanData(seatPlanRes.data[0]); // Take the first matching seat plan
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Admit card not found or unauthorized.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subCategoryId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!admitData) return <p className="text-center">No admit card data found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => toPDF()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download PDF
        </button>
      </div>

      <div
        ref={targetRef}
        className="p-6 bg-white shadow rounded border border-gray-200"
        style={{ width: "794px", height: "1123px" }} // A4 size in pixels (96dpi)
      >
        <h2 className="text-3xl font-bold mb-6 text-center underline">Admit Card</h2>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <div className="space-y-3 text-lg">
              <p><strong>Name:</strong> {admitData.student_name}</p>
              <p><strong>Father's Name:</strong> {admitData.father_name}</p>
              <p><strong>Mother's Name:</strong> {admitData.mother_name}</p>
              <p><strong>Class:</strong> {admitData.student_class}</p>
              <p><strong>Gender:</strong> {admitData.gender}</p>
              <p><strong>DOB:</strong> {admitData.dob}</p>
              <p><strong>Applicant No:</strong> {admitData.applicant_number}</p>
              <p><strong>Roll No:</strong> {admitData.roll_number || "Not assigned yet"}</p>
              <p><strong>Program:</strong> {admitData.post_title}</p>
              <p><strong>Subcategory:</strong> {admitData.subcategory_name}</p>
              
              {/* Seat Plan Information */}
              {seatPlanData && (
                <>
                  <p className="mt-4">
                    <strong>Exam Center:</strong> {seatPlanData.exam_center}, {seatPlanData.building}, Floor {seatPlanData.floor}, Room {seatPlanData.room_no}
                  </p>
                  <p>
                    <strong>Exam Date & Time:</strong> {new Date(seatPlanData.exam_date_time).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="mb-4 border-2 border-gray-400 p-1">
              {admitData.photo ? (
                <img
                  src={`http://localhost:8000/api${admitData.photo}`}
                  alt="Applicant Photo"
                  className="w-40 h-40 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150?text=No+Photo";
                  }}
                />
              ) : (
                <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-gray-500">
                  No photo
                </div>
              )}
            </div>
            <div className="border-t-2 border-gray-400 pt-2 w-full text-center">
              <p className="text-sm">Applicant Photo</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="w-64 border-t-2 border-gray-400 pt-2 text-center">
              {admitData.signature ? (
                <img
                  src={`http://localhost:8000/api${admitData.signature}`}
                  alt="Applicant Signature"
                  className="h-16 object-contain mx-auto"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x60?text=No+Signature";
                  }}
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-gray-500">
                  No signature
                </div>
              )}
              <p className="text-sm">Applicant Signature</p>
            </div>
            
            <div className="text-right">
              <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              <div className="mt-8">
                <p className="border-t-2 border-gray-400 w-48 mx-auto pt-1"></p>
                <p className="text-sm">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>This is an electronically generated document and does not require a signature.</p>
          <p className="mt-2">Please bring this admit card to the examination center.</p>
          {seatPlanData && (
            <p className="mt-2 font-medium">
              Exam Venue: {seatPlanData.exam_center}, {seatPlanData.building}, Floor {seatPlanData.floor}, Room {seatPlanData.room_no}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdmitCard;