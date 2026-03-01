/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pixel Compressor - A cute image compressor ❤              *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {configureStore} from "@reduxjs/toolkit"
import themeReducer, {useThemeSelector, useThemeActions} from "./reducers/themeReducer"
import actionReducer, {useActionSelector, useActionActions} from "./reducers/actionReducer"
import compressReducer, {useCompressSelector, useCompressActions} from "./reducers/compressReducer"

const store = configureStore({
    reducer: {
        theme: themeReducer,
        action: actionReducer,
        compress: compressReducer
    },
})

export type StoreState = ReturnType<typeof store.getState>
export type StoreDispatch = typeof store.dispatch

export {
    useThemeSelector, useThemeActions,
    useActionSelector, useActionActions,
    useCompressSelector, useCompressActions
}

export default store