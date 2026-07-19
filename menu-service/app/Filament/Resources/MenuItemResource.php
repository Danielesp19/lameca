<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MenuItemResource\Pages;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Section;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class MenuItemResource extends Resource
{
    protected static ?string $model = MenuItem::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'Ítems del menú';

    protected static ?string $modelLabel = 'Ítem';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Section::make('Información básica')->schema([
                Select::make('menu_category_id')
                    ->label('Categoría')
                    ->options(MenuCategory::where('is_active', true)->orderBy('sort_order')->pluck('name', 'id'))
                    ->required()
                    ->searchable(),

                TextInput::make('name')
                    ->label('Nombre')
                    ->required()
                    ->maxLength(255),

                Textarea::make('description')
                    ->label('Descripción')
                    ->nullable()
                    ->rows(3),

                TextInput::make('price')
                    ->label('Precio')
                    ->required()
                    ->numeric()
                    ->prefix('$')
                    ->minValue(0),

                Select::make('caffeine_level')
                    ->label('Nivel de cafeína')
                    ->options([
                        0 => '🌿 Sin cafeína',
                        1 => '☕ Baja',
                        2 => '☕☕ Media',
                        3 => '☕☕☕ Alta',
                    ])
                    ->nullable()
                    ->helperText('Se muestra con emojis en la carta. Déjalo vacío para no mostrarlo.'),
            ]),

            Section::make('Media')->schema([
                FileUpload::make('image')
                    ->label('Foto principal')
                    ->image()
                    ->directory('menu-items/images')
                    ->imageEditor()
                    // Reduce en el navegador antes de subir (mismo tope que el panel web)
                    ->imageResizeMode('contain')
                    ->imageResizeTargetWidth('1600')
                    ->imageResizeTargetHeight('1600')
                    ->nullable(),

                FileUpload::make('gif')
                    ->label('GIF animado')
                    ->acceptedFileTypes(['image/gif'])
                    ->directory('menu-items/gifs')
                    ->nullable()
                    ->helperText('Sube un .gif para mostrarlo al hacer hover o en el detalle del ítem.'),

                TextInput::make('youtube_url')
                    ->label('URL de YouTube')
                    ->url()
                    ->nullable()
                    ->placeholder('https://www.youtube.com/watch?v=...')
                    ->helperText('El video se mostrará en el detalle del ítem.'),
            ]),

            Section::make('Opciones')->schema([
                TextInput::make('sort_order')
                    ->label('Orden')
                    ->numeric()
                    ->default(0),

                Toggle::make('is_available')
                    ->label('Disponible')
                    ->default(true),

                Toggle::make('is_featured')
                    ->label('Destacado')
                    ->default(false),

                Toggle::make('has_sugar_option')
                    ->label('Permitir elegir nivel de azúcar')
                    ->default(true)
                    ->helperText('El cliente podrá escoger el nivel de azúcar al pedir este producto.'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('image')->label('Foto'),
                TextColumn::make('name')->label('Nombre')->searchable(),
                TextColumn::make('category.name')->label('Categoría')->sortable(),
                TextColumn::make('price')->label('Precio')->money('cop')->sortable(),
                IconColumn::make('gif')->label('GIF')->boolean()->trueIcon('heroicon-o-film'),
                IconColumn::make('youtube_url')->label('Video')->boolean()->trueIcon('heroicon-o-play'),
                IconColumn::make('is_available')->label('Disponible')->boolean(),
                IconColumn::make('is_featured')->label('Destacado')->boolean(),
            ])
            ->defaultSort('menu_category_id')
            ->filters([
                SelectFilter::make('menu_category_id')
                    ->label('Categoría')
                    ->options(MenuCategory::pluck('name', 'id')),
                SelectFilter::make('is_available')
                    ->label('Disponibilidad')
                    ->options([1 => 'Disponible', 0 => 'No disponible']),
            ])
            ->actions([EditAction::make(), DeleteAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListMenuItems::route('/'),
            'create' => Pages\CreateMenuItem::route('/create'),
            'edit'   => Pages\EditMenuItem::route('/{record}/edit'),
        ];
    }
}
