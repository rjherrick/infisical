import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import passport from 'passport';
import { requireAuth, validateRequest } from '../../middleware';
import { authController } from '../../controllers/v1';
import { authLimiter } from '../../helpers/rateLimiter';
import { AUTH_MODE_JWT } from '../../variables';

import { createToken } from '../../helpers';
import {
  getJwtProviderAuthLifetime,
  getJwtProviderAuthSecret
} from '../../config';

import {
  User,
  MembershipOrg,
  Organization
} from '../../models';

router.post('/token', validateRequest, authController.getNewToken);

router.post( // deprecated (moved to api/v2/auth/login1)
  '/login1',
  authLimiter,
  body('email').exists().trim().notEmpty(),
  body('clientPublicKey').exists().trim().notEmpty(),
  validateRequest,
  authController.login1
);

router.post( // deprecated (moved to api/v2/auth/login2)
  '/login2',
  authLimiter,
  body('email').exists().trim().notEmpty(),
  body('clientProof').exists().trim().notEmpty(),
  validateRequest,
  authController.login2
);

router.post(
  '/logout',
  authLimiter,
  requireAuth({
    acceptedAuthModes: [AUTH_MODE_JWT]
  }),
  authController.logout
);

router.post(
  '/checkAuth',
  requireAuth({
    acceptedAuthModes: [AUTH_MODE_JWT]
  }),
  authController.checkAuth
);

router.get(
  '/redirect/google',
  authLimiter,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

router.get(
  '/callback/google',
  passport.authenticate('google', { failureRedirect: '/login/provider/error', session: false }),
  authController.handleAuthProviderCallback,
);

// WORK OS
import { WorkOS } from '@workos-inc/node';
import { UnauthorizedRequestError } from '../../utils/errors';
const workos = new WorkOS(process.env.WORKOS_API_KEY!); // TODO: move this out to config
const clientID = process.env.WORKOS_CLIENT_ID!;

router.get( // TODO: get WorkOS SAML details
  '/saml/config',
  async (req, res) => {

  }
);

router.post( // TODO: post WorkOS SAML details
  '/saml/config',
  body('apiKey').exists().isString(),
  body('clientId').exists().isString(),
  async (req, res) => {
    
  }
);

router.get('/auth', async (req, res) => {
  // The user's organization ID
  // from Infisical Login with SAML SSO hits this endpoint
  console.log('WorkOS /auth');
  const email = req.query.email as string;
  // const organizationId = req.query.organizationId as string;

  const user = await User.findOne({
    email
  }).select('+publicKey');
  
  if (!user) throw UnauthorizedRequestError({
    message: 'No SAML SSO enabled organization could be found.'
  });
  
  const membershipOrg = await MembershipOrg.findOne({
    user: user._id
  });

  if (!membershipOrg) throw UnauthorizedRequestError({
    message: 'No SAML SSO enabled organization could be found.'
  });

  // TODO: validate that the organization has SAML-enabled
  const organization = await Organization.findById(membershipOrg.organization);

  if (!organization) throw UnauthorizedRequestError({
    message: 'No SAML SSO enabled organization could be found.'
  });
  
  console.log('organization: ', organization);

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
  
  const redirectURI = `http://localhost:8080/login/provider/success`;
  
  const authorizationUrl = workos.sso.getAuthorizationURL({
    organization: organization._id.toString(),
    redirectURI,
    clientID,
    state: providerAuthToken
  });

  res.redirect(authorizationUrl);
});

router.get('/callback', async (req, res) => {
  // From Okta hits this endpoint - might have to add some org id logic here?
  console.log('WorkOS /callback');
  const code = req.query.code as string;

  const { profile } = await workos.sso.getProfileAndToken({
    code,
    clientID,
  });

  let user = await User.findOne({
    email: profile.email,
    authProvider: profile.connection_type,
    authId: profile.id
  }).select('+publicKey');
  
  if (!user) {
    user = await new User({ // findOneAndUpdate?
      email: profile.email,
      authProvider: profile.connection_type,
      authId: profile.id
    }).save();
  }
  
  const isUserCompleted = !!user.publicKey;
  const providerAuthToken = createToken({
    payload: {
      userId: user._id.toString(),
      email: user.email,
      authProvider: user.authProvider,
      isUserCompleted
    },
    expiresIn: await getJwtProviderAuthLifetime(),
    secret: await getJwtProviderAuthSecret(),
  });

  req.providerAuthToken = providerAuthToken;
  
  if (isUserCompleted) {
    return res.redirect(`/login?providerAuthToken=${providerAuthToken}`);
  }
  
  res.redirect(`/signup?providerAuthToken=${providerAuthToken}`);
});

router.get(
  '/common-passwords',
  authLimiter,
  authController.getCommonPasswords
);

router.delete(
  '/sessions',
  authLimiter,
  requireAuth({
    acceptedAuthModes: [AUTH_MODE_JWT]
  }), 
  authController.revokeAllSessions
);

export default router;
