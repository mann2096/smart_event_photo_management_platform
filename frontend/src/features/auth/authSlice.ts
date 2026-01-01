import {createSlice} from "@reduxjs/toolkit";
import type {User} from "./types";
import type {PayloadAction} from "@reduxjs/toolkit";

interface SetCredentialsPayload {
    user:User;
    accessToken:string;
    refreshToken:string|null;
}

interface AuthState {
    user:User|null;
    accessToken:string|null;
    refreshToken:string|null;
    isAuthenticated:boolean;
}

const initialState:AuthState={
    user:null,
    accessToken:localStorage.getItem("accessToken"),
    refreshToken:localStorage.getItem("refreshToken"),
    isAuthenticated:!!localStorage.getItem("accessToken"),
};

const authSlice=createSlice({
    name:"auth",
    initialState,
    reducers:{
        setCredentials:(state,action:PayloadAction<SetCredentialsPayload>) => {
            state.user=action.payload.user;
            state.accessToken=action.payload.accessToken;
            state.refreshToken=action.payload.refreshToken;
            state.isAuthenticated=true;
        },
        setUser(state,action:PayloadAction<User>) {
            state.user=action.payload;
        },
        logout(state) {
            state.user=null;
            state.accessToken=null;
            state.refreshToken=null;
            state.isAuthenticated=false;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        },
        setTokens:(
            state,
            action:PayloadAction<{
                accessToken:string;
                refreshToken:string|null;
            }>
            ) => {
            state.accessToken=action.payload.accessToken;
            state.refreshToken=action.payload.refreshToken;
            }
    },
});

export const {setCredentials,setUser,logout,setTokens}=authSlice.actions;
export default authSlice.reducer;
