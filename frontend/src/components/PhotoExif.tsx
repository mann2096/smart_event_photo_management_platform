type PhotoExifProps = {
  exif: Record<string, any>|null;
};

export default function PhotoExif({exif}:PhotoExifProps) {
  if(!exif){
    return <p>No EXIF data available</p>;
  }
  return(
    <div>
      <h4>Photo Details</h4>
      <ul>
        {exif.camera_model && (
          <li>Camera:{exif.camera_model}</li>
        )}
        {exif.iso && <li>ISO: {exif.iso}</li>}
        {exif.aperture && (<li>Aperture: {exif.aperture}</li>)}
        {exif.shutter_speed && (<li>Shutter: {exif.shutter_speed}</li>)}
        {exif.taken_at && (
          <li>
            Taken at:{" "}
            {new Date(exif.taken_at).toLocaleString()}
          </li>
        )}
        {exif.latitude && exif.longitude && (
          <li>
            Location: {exif.latitude}, {exif.longitude}
          </li>
        )}
      </ul>
    </div>
  );
}
