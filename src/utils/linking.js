export const linking = {
  prefixes: ["wio://", "https://whosinoffice.com"],
  config: {
    screens: {
      Login: "login",
      Register: "invite/:token",
      AdminDashboard: {
        screens: {},
      },
      EmployeeDashboard: {},
    },
  },
};
