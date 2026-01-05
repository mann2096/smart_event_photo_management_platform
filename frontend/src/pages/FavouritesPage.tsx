import { useGetFavouritePhotosQuery } from "../services/photosApi";
import { useToggleFavouriteMutation } from "../services/photosApi";

export default function FavouritesPage(){
  const {data,isLoading,error}=useGetFavouritePhotosQuery();
  const [toggleFavourite]=useToggleFavouriteMutation();
  if (isLoading) return <p>Loading favourites...</p>;
  if (error) return <p>Failed to load favourites</p>;
  if (!data||data.length===0){
    return <p>No favourite photos yet</p>;
  }
  return(
    <div>
      <h2>Favourites</h2>
      <div>
        {data.map((photo) => (
          <div key={photo.id}>
            <img src={photo.image} alt="Favourite" width={200}/>
            <button onClick={() => toggleFavourite(photo.id)}>
              Remove from favourites
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
