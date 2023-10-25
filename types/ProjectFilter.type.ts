import { currency, status, type } from "@prisma/client";

export interface filterType {
  projectname?: string;
  description?: string;
  projecttype?: type;
  projectstatus?: status;
  projectstartdate?: Date;
  projectmanager?: string;
  currency?: currency;
}
