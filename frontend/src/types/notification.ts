export type Notification={
  id:string;
  type:string;
  payload:Record<string,any>;
  is_read:boolean;
  created_at:string;
};
