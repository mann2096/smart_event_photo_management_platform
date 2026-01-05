export type Photo={
  id:string;
  event:{
    id:string;
    name:string;
    visibility:"public"|"private";
  };
  image:string;
  uploaded_by:{
    id:string;
    user_name:string;
    email:string;
  };
  uploaded_at:string;
  exif_data:any|null;
  views:number;
};
