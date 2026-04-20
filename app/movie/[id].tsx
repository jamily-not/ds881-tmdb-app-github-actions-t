import { useLocalSearchParams, Link } from 'expo-router';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { Pressable, FlatList, View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { api } from '../../src/api/tmdb';

interface MovieDetails {
  id: string;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  runtime: number;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export default function MovieDetailsScreen() {
  // Captura o parâmetro '[id]' do nome do arquivo
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const [movieResponse, creditsResponse] = await Promise.all([
          api.get(`/movie/${id}`),
          api.get(`/movie/${id}/credits`)
        ]);
        setMovie(movieResponse.data);
        // Limita o elenco aos 20 primeiros atores para economizar memória do dispositivo
        setCast(creditsResponse.data.cast.slice(0, 20));
      } catch (error) {
        console.error('Erro ao buscar detalhes do autor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]); // O hook é re-executado caso o ID mude

  const renderCastItem = ({ item }: { item: CastMember }) => (
    <Link href={`/actor/${item.id}`} asChild>
      <Pressable style={styles.castCard}>
        <Image
          source={
            item.profile_path
              ? `https://image.tmdb.org/t/p/w200${item.profile_path}`
              : require('../../assets/images/partial-react-logo.png') // Necessário um avatar padrão local
          }
          style={styles.castImage}
          contentFit="cover"
          transition={300}
        />
        <Text style={styles.castName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.castCharacter} numberOfLines={2}>{item.character}</Text>
      </Pressable>
    </Link>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Filme não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {movie.poster_path && (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
          style={styles.backdrop}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{movie.title}</Text>

        <View style={styles.statsContainer}>
          <Text style={styles.statText}>⭐ {movie.vote_average.toFixed(1)}/10</Text>
          <Text style={styles.statText}>⏱️ {movie.runtime} min</Text>
        </View>

        <Text style={styles.sectionTitle}>Sinopse</Text>
        <Text style={styles.overview}>
          {movie.overview || 'Sinopse não disponível para este filme.'}
        </Text>
      </View>
      <FlatList
        horizontal
        data={cast}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCastItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  backdrop: { width: '100%', height: 250, backgroundColor: '#1F1F1F' },
  content: { padding: 20, paddingBottom: 0 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statText: { color: '#E50914', fontSize: 16, fontWeight: '600' },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  overview: { color: '#D1D5DB', fontSize: 16, lineHeight: 24 },
  errorText: { color: '#FFFFFF', fontSize: 18 },
  listContainer: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  castCard: { width: 100 },
  castImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#333', marginBottom: 8 },
  castName: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  castCharacter: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 2 },
});
