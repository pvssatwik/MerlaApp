export const FORMS = [
  {
    title: "Egg Production",
    api: "eggproduction",
    fields: [
      { name: "shed_no", label: "Shed No", type: "number", required: true },

      {
        name: "flock_no",
        label: "Flock No",
        type: "text", // later can be dropdown
        required: true,
      },

      {
        name: "production_date",
        label: "Production Date",
        type: "date",
        required: true,
      },
      {
        name: "transaction_type",
        label: "Transaction Type",
        type: "dropdown",
        options: ["PRODUCTION", "ADJUSTMENT", "DAMAGE"],
        required: true,
      },
      {
        name: "egg_type",
        label: "Egg Type",
        type: "dropdown",
        options: ["NORMAL", "BROKEN", "JUMBO", "SMALL"],
        required: true,
      },

      { name: "egg_count", label: "Egg Count", type: "number", required: true },

      {
        name: "trip_no",
        label: "Trip No",
        type: "text",
      },

      { name: "comments", label: "Comments", type: "text" },
    ],
  },
  {
    title: "Flock Master",
    api: "flockMaster",
    fields: [
      {
        name: "flock_no",
        label: "Flock No",
        type: "number",
        required: true,
      },
      {
        name: "flock_name",
        label: "Flock Name",
        type: "text",
        required: true,
      },
      {
        name: "chick_shed_no",
        label: "Chick Shed No",
        type: "number",
        required: true,
      },
      {
        name: "volume",
        label: "Volume",
        type: "number",
      },
      {
        name: "incepted_date",
        label: "Incepted Date",
        type: "date",
        required: true,
      },
      {
        name: "initial_count",
        label: "Initial Count",
        type: "number",
        required: true,
      },
      {
        name: "current_status",
        label: "Current Status",
        type: "dropdown",
        options: ["ACTIVE", "INACTIVE", "TRANSFERRED"],
        required: true,
      },
      {
        name: "layer_shed_no",
        label: "Layer Shed No",
        type: "number",
      },
      {
        name: "transfer_date",
        label: "Transfer Date",
        type: "date",
      },
      {
        name: "transfer_volume",
        label: "Transfer Volume",
        type: "number",
      },
      {
        name: "comments",
        label: "Comments",
        type: "text",
      },
    ],
  },
  {
    title: "Bird Live Stock",
    api: "birdLiveStock",
    fields: [
      {
        name: "shed_no",
        label: "Shed No",
        type: "number",
        required: true,
      },
      {
        name: "flock_no",
        label: "Flock No",
        type: "text",
        required: true,
      },
      {
        name: "reporting_date",
        label: "Reporting Date",
        type: "date",
        required: true,
      },
      {
        name: "loss_of_bird",
        label: "Loss Of Bird",
        type: "number",
        required: true,
      },
      {
        name: "loss_type",
        label: "Loss Type",
        type: "dropdown",
        options: ["DISEASE", "ACCIDENT", "NATURAL", "OTHER"],
        required: true,
      },
      {
        name: "balance_count",
        label: "Balance Count",
        type: "number",
        required: true,
      },
      {
        name: "comments",
        label: "Comments",
        type: "text",
      },
      {
        title: "Feed Shed Stock",
        api: "feedShedStock",
        fields: [
          { name: "shed_no", label: "Shed No", type: "number", required: true },
          { name: "flock_no", label: "Flock No", type: "text", required: true },

          {
            name: "reporting_date",
            label: "Reporting Date",
            type: "date",
            required: true,
          },

          {
            name: "feed_type",
            label: "Feed Type",
            type: "dropdown",
            options: ["STARTER", "GROWER", "FINISHER"],
            required: true,
          },

          { name: "volume", label: "Volume", type: "number", required: true },

          {
            name: "feed_balance",
            label: "Feed Balance",
            type: "number",
            required: true,
          },

          { name: "comments", label: "Comments", type: "text" },
        ],
      },
    ],
  },
  {
    title: "Feed Consumption",
    api: "feedConsumption",
    fields: [
      { name: "shed_no", label: "Shed No", type: "number", required: true },
      { name: "flock_no", label: "Flock No", type: "text", required: true },

      {
        name: "reporting_date",
        label: "Reporting Date",
        type: "date",
        required: true,
      },

      {
        name: "feed_type",
        label: "Feed Type",
        type: "dropdown",
        options: ["STARTER", "GROWER", "FINISHER"],
        required: true,
      },

      {
        name: "feed_used",
        label: "Feed Used",
        type: "number",
        required: true,
      },

      {
        name: "feed_balance",
        label: "Feed Balance",
        type: "number",
        required: true,
      },

      { name: "comments", label: "Comments", type: "text" },
    ],
  },
  {
    title: "Raw Material Stock",
    api: "rawMaterialStock",
    fields: [
      {
        name: "reporting_date",
        label: "Reporting Date",
        type: "date",
        required: true,
      },
      {
        name: "material_type",
        label: "Material Type",
        type: "dropdown",
        options: ["MAIZE", "SOYA", "VITAMINS", "OTHER"],
        required: true,
      },
      {
        name: "volume",
        label: "Volume",
        type: "number",
        required: true,
      },
      {
        name: "transaction_type",
        label: "Transaction Type",
        type: "dropdown",
        options: ["IN", "OUT", "ADJUSTMENT"],
        required: true,
      },
      {
        name: "comments",
        label: "Comments",
        type: "text",
      },
    ],
  },
  {
    title: "Feed Production",
    api: "feedProduction",
    fields: [
      {
        name: "production_date",
        label: "Production Date",
        type: "date",
        required: true,
      },
      {
        name: "feed_type",
        label: "Feed Type",
        type: "dropdown",
        options: ["STARTER", "GROWER", "FINISHER"],
        required: true,
      },
      {
        name: "volume",
        label: "Volume",
        type: "number",
        required: true,
      },
      {
        name: "comments",
        label: "Comments",
        type: "text",
      },
    ],
  },
  {
    title: "Feed Supply",
    api: "feedSupply",
    fields: [
      {
        name: "shed_no",
        label: "Shed No",
        type: "number",
        required: true,
      },
      {
        name: "flock_no",
        label: "Flock No",
        type: "text",
        required: true,
      },
      {
        name: "supply_date",
        label: "Supply Date",
        type: "date",
        required: true,
      },
      {
        name: "feed_type",
        label: "Feed Type",
        type: "dropdown",
        options: ["STARTER", "GROWER", "FINISHER"],
        required: true,
      },
      {
        name: "comments",
        label: "Comments",
        type: "text",
      },
    ],
  },
  {
    title: "Egg Godown Stock",
    api: "eggGodownStock",
    fields: [
      { name: "shed_no", label: "Shed No", type: "number", required: true },
      { name: "flock_no", label: "Flock No", type: "text", required: true },

      {
        name: "production_date",
        label: "Production Date",
        type: "date",
        required: true,
      },

      {
        name: "egg_type",
        label: "Egg Type",
        type: "dropdown",
        options: ["NORMAL", "BROKEN", "JUMBO", "SMALL"],
        required: true,
      },

      {
        name: "egg_count",
        label: "Egg Count",
        type: "number",
        required: true,
      },

      { name: "trip_no", label: "Trip No", type: "text" },

      {
        name: "total_egg_stock",
        label: "Total Egg Stock",
        type: "number",
        required: true,
      },

      { name: "comments", label: "Comments", type: "text" },
    ],
  },
  {
    title: "Egg Sale Summary",
    api: "eggSaleSummary",
    fields: [
      {
        name: "sale_date",
        label: "Sale Date",
        type: "date",
        required: true,
      },

      {
        name: "transaction_type",
        label: "Transaction Type",
        type: "dropdown",
        options: ["SALE", "RETURN", "ADJUSTMENT"],
        required: true,
      },

      {
        name: "egg_type",
        label: "Egg Type",
        type: "dropdown",
        options: ["NORMAL", "BROKEN", "JUMBO", "SMALL"],
        required: true,
      },

      {
        name: "eggs_volume",
        label: "Eggs Volume",
        type: "number",
        required: true,
      },

      { name: "gate_pass_no", label: "Gate Pass No", type: "text" },

      {
        name: "customer_name",
        label: "Customer Name",
        type: "text",
        required: true,
      },

      {
        name: "customer_mobile_no",
        label: "Customer Mobile No",
        type: "text",
      },

      {
        name: "transport_mode",
        label: "Transport Mode",
        type: "dropdown",
        options: ["TRUCK", "AUTO", "MANUAL"],
      },

      {
        name: "vehicle_type",
        label: "Vehicle Type",
        type: "dropdown",
        options: ["SMALL", "MEDIUM", "LARGE"],
      },

      { name: "vehicle_no", label: "Vehicle No", type: "text" },

      {
        name: "balance_count",
        label: "Balance Count",
        type: "number",
      },

      { name: "comments", label: "Comments", type: "text" },
    ],
  },
];
