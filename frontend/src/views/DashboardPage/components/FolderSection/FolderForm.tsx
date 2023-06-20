import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { Button, FormControl, Input, ModalClose } from "@app/components/v2";

type Props = {
  onCreateFolder: (folderName: string) => Promise<void>;
  onUpdateFolder: (folderName: string) => Promise<void>;
  isEdit?: boolean;
  defaultFolderName?: string;
};

const formSchema = yup.object({
  name: yup
    .string()
    .required()
    .trim()
    .matches(/^[a-zA-Z0-9-_]+$/, "Folder name cannot contain spaces. Only underscore and dashes")
    .label("Tag Name")
});
type TFormData = yup.InferType<typeof formSchema>;

export const FolderForm = ({
  isEdit,
  onCreateFolder,
  defaultFolderName,
  onUpdateFolder
}: Props): JSX.Element => {
  const {
    control,
    reset,
    formState: { isSubmitting },
    handleSubmit
  } = useForm<TFormData>({
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: defaultFolderName
    }
  });

  const onSubmit = async ({ name }: TFormData) => {
    if (isEdit) {
      await onUpdateFolder(name);
    } else {
      await onCreateFolder(name);
    }
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="name"
        defaultValue=""
        render={({ field, fieldState: { error } }) => (
          <FormControl label="Folder Name" isError={Boolean(error)} errorText={error?.message}>
            <Input {...field} placeholder="Type your folder name" />
          </FormControl>
        )}
      />
      <div className="mt-8 flex items-center">
        <Button className="mr-4" type="submit" isDisabled={isSubmitting} isLoading={isSubmitting}>
          {isEdit ? "Save" : "Create"}
        </Button>
        <ModalClose asChild>
          <Button variant="plain" colorSchema="secondary">
            Cancel
          </Button>
        </ModalClose>
      </div>
    </form>
  );
};
