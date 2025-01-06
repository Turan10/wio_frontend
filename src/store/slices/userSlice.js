import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    isAdmin: false,
    companyId: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAdmin = action.payload.role === "ADMIN";
      state.companyId = action.payload.companyId || null;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAdmin = false;
      state.companyId = null;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
