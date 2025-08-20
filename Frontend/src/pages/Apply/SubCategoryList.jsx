import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function SubCategoryList() {
  const { postId } = useParams(); // postId = category id
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/posts/${postId}/subcategories/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch subcategories.");
        }
        return res.json();
      })
      .then((data) => {
        setSubcategories(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching subcategories:", error);
        setLoading(false);
      });
  }, [postId]);

  if (loading) return <p className="text-center mt-8">Loading subcategories...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Available Subcategories</h2>

      {subcategories.length === 0 ? (
        <p>No subcategories available for this category.</p>
      ) : (
        subcategories.map((subCat) => (
          <div key={subCat.id} className="border p-4 rounded shadow mb-4">
            <h3 className="text-lg font-semibold">{subCat.name}</h3>
            <p className="text-gray-700 mb-1">{subCat.description}</p>

            {subCat.deadline && (
              <p className="text-sm text-red-500">
                Deadline: {subCat.deadline}
              </p>
            )}

            <div className="flex justify-between mt-4">
              <button
                onClick={() => navigate(`/apply/${subCat.id}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Apply
              </button>

              <button
                onClick={() => navigate(`/submitted/${subCat.id}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                View
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default SubCategoryList;
