import { color } from "metabase/lib/colors";
import { createEntity } from "metabase/lib/entities";

import { DataAppSchema } from "metabase/schema";
import { CollectionsApi, DataAppsApi } from "metabase/services";

import { Collection, DataApp } from "metabase-types/api";

import { DEFAULT_COLLECTION_COLOR_ALIAS } from "../collections/constants";

import { createNewAppForm, createAppSettingsForm } from "./forms";
import { getDataAppIcon, isDataAppCollection } from "./utils";

type EditableDataAppParams = Pick<
  DataApp,
  "dashboard_id" | "options" | "nav_items"
> &
  Pick<Collection, "name" | "description">;

type CreateDataAppParams = Partial<EditableDataAppParams> &
  Pick<EditableDataAppParams, "name">;

type UpdateDataAppParams = Pick<DataApp, "id" | "collection_id"> & {
  collection: Pick<Collection, "name" | "description">;
};

const DataApps = createEntity({
  name: "dataApps",
  nameOne: "dataApp",

  displayNameOne: "app",
  displayNameMany: "apps",

  path: "/api/app",
  schema: DataAppSchema,

  api: {
    create: async ({
      name,
      description,
      ...dataAppProps
    }: CreateDataAppParams) => {
      return DataAppsApi.create({
        ...dataAppProps,
        collection: {
          name,
          description: description || null,
          color: color(DEFAULT_COLLECTION_COLOR_ALIAS),
        },
      });
    },
    update: async ({
      id,
      collection,
      collection_id,
      ...rest
    }: UpdateDataAppParams) => {
      await CollectionsApi.update({ ...collection, id: collection_id });
      return DataAppsApi.update({ id, ...rest });
    },
  },

  objectSelectors: {
    getIcon: getDataAppIcon,
  },

  forms: {
    create: {
      fields: createNewAppForm,
    },
    settings: {
      fields: createAppSettingsForm,
    },
  },
});

export { getDataAppIcon, isDataAppCollection };

export default DataApps;