import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { posts } from "../../lib/api";

const CategoryList = () => {
  const [postsList, setPostsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await posts.getAll();
        setPostsList(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleViewSubcategories = (postId) => {
    navigate(`/login?categoryId=${postId}`); // Pass categoryId to login
  };

  if (loading) return <div className="max-w-3xl mx-auto p-4">Loading...</div>;
  if (error)
    return <div className="max-w-3xl mx-auto p-4 text-red-500">{error}</div>;
  if (postsList.length === 0)
    return <div className="max-w-3xl mx-auto p-4">No posts available</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Available Jobs</h2>
      {postsList.map((post) => (
        <div key={post.id} className="p-4 border rounded shadow mb-4">
          <h3 className="text-lg font-semibold">{post.title}</h3>
          <p className="text-gray-600">{post.category}</p>
          <p className="text-sm my-2">{post.description}</p>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            onClick={() => handleViewSubcategories(post.id)}
          >
            View Subcategories
          </button>
        </div>
      ))}
    </div>
  );
};

export default CategoryList;
