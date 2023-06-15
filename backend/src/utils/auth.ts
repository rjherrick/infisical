import express from 'express';
import passport from 'passport';
import { AuthData } from '../interfaces/middleware';
import {
  AuthProvider,
  User,
  ServiceAccount,
  ServiceTokenData,
} from '../models';
import { createToken } from '../helpers/auth';
import {
  getClientIdGoogle,
  getClientSecretGoogle,
  getJwtProviderAuthLifetime,
  getJwtProviderAuthSecret,
  getSamlEntrypoint,
  getSamlIssuer,
  getSamlCert,
  getSamlAudience
} from '../config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const SamlStrategy = require('@node-saml/passport-saml').Strategy;
const SamlStrategy = require('@node-saml/passport-saml').Strategy;

const { MultiSamlStrategy } = require('@node-saml/passport-saml');

/**
 * Returns an object containing the id of the authentication data payload
 * @param {AuthData} authData - authentication data object
 * @returns 
 */
const getAuthDataPayloadIdObj = (authData: AuthData) => {
  if (authData.authPayload instanceof User) {
    return { userId: authData.authPayload._id };
  }

  if (authData.authPayload instanceof ServiceAccount) {
    return { serviceAccountId: authData.authPayload._id };
  }

  if (authData.authPayload instanceof ServiceTokenData) {
    return { serviceTokenDataId: authData.authPayload._id };
  }
};

/**
 * Returns an object containing the user associated with the authentication data payload
 * @param {AuthData} authData - authentication data object
 * @returns 
 */
const getAuthDataPayloadUserObj = (authData: AuthData) => {

  if (authData.authPayload instanceof User) {
    return { user: authData.authPayload._id };
  }

  if (authData.authPayload instanceof ServiceAccount) {
    return { user: authData.authPayload.user };
  }

  if (authData.authPayload instanceof ServiceTokenData) {
    return { user: authData.authPayload.user };
  }
}

const path = '/api/v1/auth/callback/saml';
const entryPoint = '/api/v1/auth/callback/okta/123';
const issuer = '';
const cert = `
`;

const audience = 'https://app.infisical.com';

const initializePassport = async () => {
  passport.use(new GoogleStrategy({
    passReqToCallback: true,
    clientID: await getClientIdGoogle(),
    clientSecret: await getClientSecretGoogle(),
    callbackURL: '/api/v1/auth/callback/google',
    scope: ['profile', ' email'],
  }, async (
    req: express.Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    cb: any
  ) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({
        authProvider: AuthProvider.GOOGLE,
        authId: profile.id,
      }).select('+publicKey')

      if (!user) {
        user = await new User({
          email,
          authProvider: AuthProvider.GOOGLE,
          authId: profile.id,
        }).save();
      }

      const providerAuthToken = createToken({
        payload: {
          userId: user._id.toString(),
          email: user.email,
          authProvider: user.authProvider,
          isUserCompleted: !!user.publicKey
        },
        expiresIn: await getJwtProviderAuthLifetime(),
        secret: await getJwtProviderAuthSecret(),
      });

      req.providerAuthToken = providerAuthToken;
      cb(null, profile);
    } catch (err) {
      cb(null, false);
    }
  }));

  // passport.use(
  //   new SamlStrategy({
  //     path: '/api/v1/auth/callback/okta', // maybe this is /saml
  //     entryPoint: await getSamlEntrypoint(),
  //     issuer: await getSamlIssuer(),
  //     cert,
  //     audience: await getSamlAudience(),
  //   },
  //   function (profile: any, done: any) {
  //     // TODO
  //     return done(null, profile);
  //   }),
  // );

  passport.use('saml', new MultiSamlStrategy(
    {
      passReqToCallback: true,
      disableRequestedAuthnContext: true,
      getSamlOptions: async function(req: any, done: any) {
          const { organizationId } = req.params;

          // TODO: get [samlConfig] for organization with id [organizationId]

          const samlConfig = ({
            path,
            callbackUrl: '/api/v1/auth/callback/saml',
            entryPoint,
            issuer,
            cert,
            audience
          });

          done(null, samlConfig);
      },
    },
    async function(req: any, profile: any, done: any) {
      // Find or create user in your database based on the profile data returned from Okta
      console.log('profile: ', profile);
      const email = profile.email;

      let user = await User.findOne({
        authProvider: AuthProvider.OKTA_SAML,
        authId: profile.id
      });

      if (!user) {
        user = await new User({
          email,
          authProvider: AuthProvider.OKTA_SAML,
          authId: profile.id
        }).save();
      }

      const providerAuthToken = createToken({
        payload: {
          userId: user._id.toString(),
          email: user.email,
          authProvider: user.authProvider,
          isUserCompleted: !!user.publicKey
        },
        expiresIn: await getJwtProviderAuthLifetime(),
        secret: await getJwtProviderAuthSecret(),
      });
      
      req.providerAuthToken = providerAuthToken;

      done(null, profile);
    }
  ));

  // // Configure passport to not use sessions
  // passport.serializeUser(function(user: any, done) {
  //   done(null, user);
  // });

  // passport.deserializeUser(function(user: any, done) {
  //   done(null, user);
  // });
}

export {
  getAuthDataPayloadIdObj,
  getAuthDataPayloadUserObj,
  initializePassport,
}


