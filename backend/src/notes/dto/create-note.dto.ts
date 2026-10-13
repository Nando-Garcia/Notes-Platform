import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'El contenido no puede estar vacío' })
  @MaxLength(5000, { message: 'El contenido no puede superar los 5000 caracteres' })
  content: string;
}
