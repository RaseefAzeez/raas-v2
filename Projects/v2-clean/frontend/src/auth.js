import { Amplify } from 'aws-amplify'
import {
    signInWithRedirect,
    signOut,
    getCurrentUser,
    fetchAuthSession,
} from 'aws-amplify/auth'

console.log('Browser origin:', window.location.origin)
console.log('Browser pathname:', window.location.pathname)
console.log(
    'Configured sign-in redirect:',
    import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN
)
const amplifyConfig = {
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
}

console.log(
    'OAuth runtime diagnostic:',
    JSON.stringify({
        origin: window.location.origin,
        pathname: window.location.pathname,
        redirectSignIn: amplifyConfig.Auth.Cognito.loginWith.oauth.redirectSignIn,
        redirectSignOut: amplifyConfig.Auth.Cognito.loginWith.oauth.redirectSignOut,
        domain: amplifyConfig.Auth.Cognito.loginWith.oauth.domain,
    }, null, 2),
)

Amplify.configure(amplifyConfig)
export {
    signInWithRedirect,
    signOut,
    getCurrentUser,
    fetchAuthSession,
}