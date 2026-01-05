export type PhotoFilters = {
  eventId?:string;       
  eventIds?:string[];     
  startDate?:string;
  endDate?:string;
  tags:string[];
  eventName:string;
  timeline:boolean;
  private_only?:boolean;
};
