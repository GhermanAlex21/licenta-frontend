import React, { useEffect, useState } from "react";
import { getSerieById, updateSerie, getAllMarcas } from "../utils/service";
import { useParams, Link, useNavigate } from "react-router-dom";

const UpdateSerie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serie, setSerie] = useState({ nume: "", marcaId: "" });
  const [marci, setMarci] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serieUpdated, setSerieUpdated] = useState(false);

  useEffect(() => {
    fetchSerie();
    fetchMarci();
  }, []);

  const fetchSerie = async () => {
    try {
      const serieToUpdate = await getSerieById(id);
      if (serieToUpdate) {
        setSerie({
          nume: serieToUpdate.nume || "",
          marcaId: serieToUpdate.marca?.id || ""
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMarci = async () => {
    try {
      const marciData = await getAllMarcas();
      setMarci(marciData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSerie((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedSerie = {
        nume: serie.nume,
        marca: { id: serie.marcaId }
      };
      await updateSerie(id, updatedSerie);
      setSerieUpdated(true);
      setTimeout(() => {
        navigate("/serie/all");
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container">
      <h4 className="mt-5" style={{ color: "GrayText" }}>
        Update Serie
      </h4>
      <div className="col-8">
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="text-info">Serie:</label>
            <input
              type="text"
              className="form-control mb-4"
              name="nume"
              value={serie.nume}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="text-info">Marca:</label>
            <select
              name="marcaId"
              className="form-control mb-4"
              value={serie.marcaId}
              onChange={handleInputChange}
            >
              <option value="">Selectează Marca</option>
              {marci.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nume}
                </option>
              ))}
            </select>
          </div>
          <div className="btn-group">
            <button type="submit" className="btn btn-sm btn-outline-warning">
              Update Serie
            </button>
            <Link to={"/serie/all"} className="btn btn-outline-primary ml-2">
              Back to All Serii
            </Link>
          </div>
        </form>
        {serieUpdated && (
          <div className="alert alert-success mt-3">
            Serie updated successfully.
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateSerie;
