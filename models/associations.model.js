import { Documents } from "./documents.model.js";
import { HistoryFamily } from "./history_family.model.js";
import { Users } from "./user.model.js";


HistoryFamily.belongsTo(Documents, {
  foreignKey: 'iddocument',
  as: 'document'
});

HistoryFamily.belongsTo(Users, {
  foreignKey: 'iduser',
  as: 'user'
});
