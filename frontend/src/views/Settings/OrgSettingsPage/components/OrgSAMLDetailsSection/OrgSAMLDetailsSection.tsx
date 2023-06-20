import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, FormControl, Input } from '@app/components/v2';

const formSchema = yup.object({
    workOSApiKey: yup.string().required().label('WorkOS API Key'),
    workOSClientId: yup.string().required().label('WorkOS Client ID'),
});

type FormData = yup.InferType<typeof formSchema>;

// TODO: get these values?
// TODO: post values

export const OrgSAMLDetailsSection = (): JSX.Element => {
    const {
        handleSubmit,
        control,
        reset,
        formState: { isDirty, isSubmitting }
    } = useForm<FormData>({ 
        defaultValues: {
          workOSApiKey: '',
          workOSClientId: ''
        },
        resolver: yupResolver(formSchema)
    });

    const { t } = useTranslation();
  
//   useEffect(() => {
//     reset({ name: orgName });
//   }, [orgName]);

  const onFormSubmit = async ({ workOSApiKey, workOSClientId }: FormData) => {
    // await onOrgNameChange(name);

    console.log('onFormSubmit');
    console.log('onFormSubmit workOSApiKey: ', workOSApiKey);
    console.log('onFormSubmit workOSClientId: ', workOSClientId);
  };
  
  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="mb-6 flex w-full flex-col items-start rounded-md bg-white/5 px-6 pb-6 pt-3">
        <p className="mb-4 mt-2 text-xl font-semibold">SAML SSO</p>
        <p className="mb-2 min-w-max text-xs text-gray-500">
          Infisical partners with WorkOS for SAML SSO
        </p>
        <div className="mb-2 w-full max-w-lg">
          <Controller
            defaultValue=""
            render={({ field, fieldState: { error } }) => (
              <FormControl isError={Boolean(error)} errorText={error?.message}>
                <Input placeholder="WorkOS API Key" {...field} />
              </FormControl>
            )}
            control={control}
            name="workOSApiKey"
          />
        </div>
        <div className="mb-2 w-full max-w-lg">
          <Controller
            defaultValue=""
            render={({ field, fieldState: { error } }) => (
              <FormControl isError={Boolean(error)} errorText={error?.message}>
                <Input placeholder="WorkOS Client ID" {...field} />
              </FormControl>
            )}
            control={control}
            name="workOSClientId"
          />
        </div>
        <Button
          isLoading={isSubmitting}
          color="primary"
          variant="outline_bg"
          size="sm"
          type="submit"
          isDisabled={!isDirty || isSubmitting}
          leftIcon={<FontAwesomeIcon icon={faCheck} />}
        >
          {t('common.save-changes')}
        </Button>
      </div>
    </form>
  );
};
