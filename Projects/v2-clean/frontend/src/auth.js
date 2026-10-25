import { Amplify } from 'aws-amplify'
import {
    signInWithRedirect,
    signOut,
    getCurrentUser,
    fetchAuthSession,
} from 'aws-amplify/auth'

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
            loginWith: {
                email: true,
                oauth: {
                    domain: import.meta.env.VITE_COGNITO_DOMAIN,
                    scopes: ['openid', 'email', 'profile'],
                    redirectSignIn: [
                        import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN,
                    ],
                    redirectSignOut: [
                        import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT,
                    ],
                    responseType: 'code',
                },
            },
        },
    },
})

export {
    signInWithRedirect,
    signOut,
    getCurrentUser,
    fetchAuthSession,
}