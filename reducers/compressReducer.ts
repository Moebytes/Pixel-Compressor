import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const compressSlice = createSlice({
    name: "compress",
    initialState: {
        directory: "",
        quality: 75,
        ignoreBelow: "0KB",
        resizeWidth: "100",
        resizeHeight: "100",
        percentage: true,
        keepRatio: true,
        progressive: true,
        rename: "{name}",
        format: "original"
    },
    reducers: {
        setDirectory: (state, action) => {state.directory = action.payload},
        setQuality: (state, action) => {state.quality = action.payload},
        setIgnoreBelow: (state, action) => {state.ignoreBelow = action.payload},
        setResizeWidth: (state, action) => {state.resizeWidth = action.payload},
        setResizeHeight: (state, action) => {state.resizeHeight = action.payload},
        setPercentage: (state, action) => {state.percentage = action.payload},
        setKeepRatio: (state, action) => {state.keepRatio = action.payload},
        setProgressive: (state, action) => {state.progressive = action.payload},
        setRename: (state, action) => {state.rename = action.payload},
        setFormat: (state, action) => {state.format = action.payload}
    }
})

const {
    setDirectory, setQuality, setIgnoreBelow,
    setResizeWidth, setResizeHeight, setPercentage,
    setKeepRatio, setProgressive, setRename, setFormat
} = compressSlice.actions

export const useCompressSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        directory: selector((state) => state.compress.directory),
        quality: selector((state) => state.compress.quality),
        ignoreBelow: selector((state) => state.compress.ignoreBelow),
        resizeWidth: selector((state) => state.compress.resizeWidth),
        resizeHeight: selector((state) => state.compress.resizeHeight),
        percentage: selector((state) => state.compress.percentage),
        keepRatio: selector((state) => state.compress.keepRatio),
        progressive: selector((state) => state.compress.progressive),
        rename: selector((state) => state.compress.rename),
        format: selector((state) => state.compress.format)
    }
}

export const useCompressActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setDirectory: (state: string) => dispatch(setDirectory(state)),
        setQuality: (state: number) => dispatch(setQuality(state)),
        setIgnoreBelow: (state: string) => dispatch(setIgnoreBelow(state)),
        setResizeWidth: (state: string) => dispatch(setResizeWidth(state)),
        setResizeHeight: (state: string) => dispatch(setResizeHeight(state)),
        setPercentage: (state: boolean) => dispatch(setPercentage(state)),
        setKeepRatio: (state: boolean) => dispatch(setKeepRatio(state)),
        setProgressive: (state: boolean) => dispatch(setProgressive(state)),
        setRename: (state: string) => dispatch(setRename(state)),
        setFormat: (state: string) => dispatch(setFormat(state))
    }
}

export default compressSlice.reducer