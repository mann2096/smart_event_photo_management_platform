export type Event={
  id:string;
  name:string;
  description:string;
  start_date:string;
  end_date:string
  visibility:"public"|"private";
  created_by:string;
};
