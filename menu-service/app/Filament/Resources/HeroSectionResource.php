<?php

namespace App\Filament\Resources;

use App\Filament\Resources\HeroSectionResource\Pages;
use App\Models\HeroSection;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class HeroSectionResource extends Resource
{
    protected static ?string $model = HeroSection::class;

    protected static ?string $navigationIcon = 'heroicon-o-photo';

    protected static ?string $navigationLabel = 'Hero / Banner';

    protected static ?string $modelLabel = 'Banner';

    protected static ?int $navigationSort = 0;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Section::make('Texto')->schema([
                TextInput::make('title')
                    ->label('Título principal')
                    ->required()
                    ->maxLength(255),

                TextInput::make('subtitle')
                    ->label('Subtítulo')
                    ->nullable()
                    ->maxLength(255),

                TextInput::make('cta_label')
                    ->label('Texto del botón')
                    ->nullable()
                    ->placeholder('Ver carta completa'),

                TextInput::make('cta_url')
                    ->label('URL del botón')
                    ->nullable()
                    ->url()
                    ->placeholder('/menu'),
            ]),

            Section::make('Media de fondo')->description('El orden de prioridad es: Video YouTube → GIF → Imagen')->schema([
                TextInput::make('youtube_url')
                    ->label('Video YouTube (fondo)')
                    ->url()
                    ->nullable()
                    ->placeholder('https://www.youtube.com/watch?v=...')
                    ->helperText('Se reproducirá sin sonido y en bucle como fondo del hero.'),

                FileUpload::make('gif')
                    ->label('GIF de fondo')
                    ->acceptedFileTypes(['image/gif'])
                    ->directory('hero/gifs')
                    ->nullable(),

                FileUpload::make('image')
                    ->label('Imagen de fondo')
                    ->image()
                    ->directory('hero/images')
                    ->imageEditor()
                    ->nullable()
                    ->helperText('Fallback si no hay video ni GIF.'),
            ]),

            Section::make('Configuración')->schema([
                TextInput::make('sort_order')
                    ->label('Orden')
                    ->numeric()
                    ->default(0),

                Toggle::make('is_active')
                    ->label('Activo')
                    ->default(true),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('sort_order')->label('#')->sortable(),
                ImageColumn::make('image')->label('Preview'),
                TextColumn::make('title')->label('Título')->searchable(),
                IconColumn::make('youtube_url')->label('Video')->boolean()->trueIcon('heroicon-o-play'),
                IconColumn::make('gif')->label('GIF')->boolean()->trueIcon('heroicon-o-film'),
                IconColumn::make('is_active')->label('Activo')->boolean(),
            ])
            ->defaultSort('sort_order')
            ->actions([EditAction::make(), DeleteAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListHeroSections::route('/'),
            'create' => Pages\CreateHeroSection::route('/create'),
            'edit'   => Pages\EditHeroSection::route('/{record}/edit'),
        ];
    }
}
