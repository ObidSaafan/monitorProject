import { currency, status, type } from "@prisma/client";

export interface filterType {
  projectname?: string;
  projecttype?: type;
  projectstatus?: status;
  projectstartdate?: Date;
  projectmanager?: string;
  clientid?: string;
  currency?: currency;
}
