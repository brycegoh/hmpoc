import axios from "axios";
import {supabase} from "../lib/supabase";

const axiosInstance = axios.create({ baseURL: "http://localhost:8000/api/" });

axiosInstance.interceptors.request.use(
    async (config) => {
        const session = await supabase.auth.getSession();
        const supabaseAccessToken = session.data.session?.access_token;

        const accessToken = supabaseAccessToken;
        config.headers["Authorization"] = `Bearer ${accessToken}`; //pass in the access token from supabase session
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
