/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pixel Compressor - A cute image compressor ❤              *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const actionSlice = createSlice({
    name: "action",
    initialState: {
        clearAll: false
    },
    reducers: {
        setClearAll: (state, action) => {state.clearAll = action.payload}
    }    
})

const {
    setClearAll
} = actionSlice.actions

export const useActionSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        clearAll: selector((state) => state.action.clearAll)
    }
}

export const useActionActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setClearAll: (state: boolean) => dispatch(setClearAll(state))
    }
}

export default actionSlice.reducer